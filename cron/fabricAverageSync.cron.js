const cron = require('node-cron');

const FabricAvg = require('../modals/fabricAvg.model');
const { fetchStyleAverageDataFromGoogleSheet } = require('../services/googleSheet.service');

const syncFabricAverage = async () => {
  try {
    const fabricAverage = await fetchStyleAverageDataFromGoogleSheet();
    const operations = fabricAverage
      .filter((item) => item.styleNumber && item.pattern)
      .map((item) => ({
        updateOne: {
          filter: {
            style_number: item.styleNumber,
          },
          update: {
            $set: {
              patternNumber: item.pattern,
              fabrics: item.fabrics,
            },
          },
          upsert: true,
        },
      }));

    if (operations.length === 0) {
      console.log(`
      *****************************************************************
        No valid fabric average data to process. Skipping sync operation.

      *****************************************************************
        `);
      return;
    }

    const result = await FabricAvg.bulkWrite(operations, {
      ordered: false,
    });

    const summary = {
      total: operations.length,
      inserted: result.upsertedCount,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    };
    console.log(`
      ***************** TASK NO BY CRON :: 1 :: ********************
            Total Google Sheet records :: ${fabricAverage.length}
                   Fabric average sync completed ::
           ${JSON.stringify(summary)}

      *********************************************************
      `);
    return summary;
  } catch (error) {
    console.error('Error while syncing Fabric Average :: ', error?.message);

    throw error;
  }
};

// Run every 3 hours
cron.schedule('0 */3 * * *', async () => {
  console.log(`Fabric Average Cron Started :: ${new Date().toISOString()}`);

  try {
    await syncFabricAverage();
  } catch (error) {
    console.error('Fabric Average Cron Failed :: ', error?.message);
  }
});

// Run once when server starts
const firstRun = async () => {
  try {
    await syncFabricAverage();
  } catch (error) {
    console.error('Fabric Average First Run Failed :: ', error?.message);
  }
};

firstRun();

module.exports = {
  syncFabricAverage,
};
