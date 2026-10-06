const cron = require('node-cron');

const { fetchFabricStyleMappingFromGoogleSheet } = require('../services/googleSheet.service');

const Stock = require('../modals/stock.modal');
const ApiError = require('../utils/ApiError');

const syncStyleFabricMapping = async () => {
  try {
    const fabricStyleMappings = await fetchFabricStyleMappingFromGoogleSheet();

    if (!Array.isArray(fabricStyleMappings) || fabricStyleMappings.length === 0) {
      throw new ApiError(400, 'Fabric style mappings must be a non-empty array');
    }

    const data = fabricStyleMappings
      .map((item) => {
        const fabricNumber = Number(item.fabricNo);

        if (!fabricNumber || Number.isNaN(fabricNumber)) {
          return null;
        }

        const vendorSource = item.vendorSource?.trim() || '';

        const blockedStockDays =
          Number(item.blockedDays) ||
          ['gandhi nagar', 'chandni chowk'].includes(vendorSource.toLowerCase())
            ? 7
            : 15;

        return {
          fabricNumber,
          styleNumbers: item.styleNumbers,
          fabricName: item.fabricName,
          vendor_source: vendorSource,
          blocked_stock_days: blockedStockDays,
        };
      })
      .filter(Boolean);

    if (data.length === 0) {
      throw new ApiError(400, 'No valid fabric mappings found');
    }

    const fabricNumbers = data.map((item) => item.fabricNumber);

    const existingStocks = await Stock.find({
      fabricNumber: { $in: fabricNumbers },
    })
      .select('fabricNumber')
      .lean();

    const existingMap = new Map(existingStocks.map((item) => [Number(item.fabricNumber), true]));

    let insertedCount = 0;
    let updatedCount = 0;

    const bulkOps = data.map((item) => {
      const isExisting = existingMap.has(item.fabricNumber);

      if (isExisting) {
        updatedCount++;
      } else {
        insertedCount++;
      }

      return {
        updateOne: {
          filter: {
            fabricNumber: item.fabricNumber,
          },
          update: {
            $set: {
              // Only Google Sheet controlled fields
              styleNumbers: item.styleNumbers,
              fabricName: item.fabricName,
              vendor_source: item.vendor_source,
              blocked_stock_days: item.blocked_stock_days,
            },
          },
          upsert: true,
        },
      };
    });

    const result = await Stock.bulkWrite(bulkOps);
    const resultSummary = {
      matched: result.matchedCount,
      modified: result.modifiedCount,
      upserted: result.upsertedCount,
      inserted: insertedCount,
      updated: updatedCount,
    };

    console.log(
      `
      ***************** TASK NO BY CRON :: 2 :: **************************
                 Fabric Style Mapping Sync Result ::
      ${JSON.stringify(resultSummary)}

      *********************************************************
      `
    );
    return resultSummary;
  } catch (error) {
    console.error('Failed to sync fabric pattern and style :: ', error?.message);
    throw new ApiError(500, 'Failed to sync fabric pattern and style', error.message);
  }
};

// Run every 2 hours
// cron.schedule('0 */2 * * *', async () => {
cron.schedule('7 * * * *', async () => {
  console.log('Fabric pattern and style cron started :: ', new Date().toISOString());

  try {
    await syncStyleFabricMapping();
  } catch (error) {
    console.error('Fabric Style Mapping Cron Failed :: ', error?.message);
  }
});

module.exports = {
  syncStyleFabricMapping,
};
