const Style = require('../modals/style.modal');
const { fetchFabricNoFromFabricAverageSheet } = require('../services/googleSheet.service');
const ApiError = require('../utils/ApiError');

const syncFabricPatternAndStyle = async () => {
  try {
    const fabricStyleMappings = await fetchFabricNoFromFabricAverageSheet();
    const payload = fabricStyleMappings
      .map((mapping) => {
        const styleNumber = Number(mapping.style_number);

        // Skip invalid style number
        if (!mapping.style_number || Number.isNaN(styleNumber)) {
          return null;
        }

        const fabrics = [];

        // Add only existing fabrics
        for (let i = 1; i <= 3; i++) {
          const fabricNo = mapping[`fabric_${i}_no`];
          const fabricName = mapping[`fabric_${i}_name`];
          const fabricImage = mapping[`fabric_${i}_image`];

          // Skip completely empty fabric
          if (!fabricNo && !fabricName && !fabricImage) {
            continue;
          }

          fabrics.push({
            fabric_no: fabricNo || null,
            fabric_name: fabricName || null,
            fabric_image: fabricImage || null,
          });
        }

        return {
          styleNumber,
          patternNumber: mapping.pattern_number || null,
          articleType: mapping.article_type || 'NA',
          fabrics,
        };
      })
      .filter(Boolean);

    if (payload.length === 0) {
      throw new ApiError(400, 'No valid style mappings found');
    }

    const bulkOps = payload.map((styleData) => ({
      updateOne: {
        filter: {
          styleNumber: styleData.styleNumber,
        },
        update: {
          $set: {
            patternNumber: styleData.patternNumber,
            articleType: styleData.articleType,
            fabrics: styleData.fabrics,
          },
        },
        upsert: true,
      },
    }));

    const result = await Style.bulkWrite(bulkOps);
    const summary = {
      total: payload.length,
      inserted: result.upsertedCount,
      matched: result.matchedCount,
      modified: result.modifiedCount,
    };

    console.log(`
      ***************** TASK NO BY CRON :: 3 :: ********************
                Fabric Pattern and Style Sync completed successfully.
      ${JSON.stringify(summary)}

      *********************************************************
    `);
    return summary;
  } catch (error) {
    console.error('Failed to sync fabric pattern and style :: ', error?.message);

    throw error;
  }
};

// --------------------------------------------------
// Run immediately when server starts
// Then run every 2 hours 10 minutes
// --------------------------------------------------

const CRON_INTERVAL =
  2 * 60 * 60 * 1000 + // 2 hours
  10 * 60 * 1000; // 10 minutes

let isSyncRunning = false;

const runFabricPatternAndStyleSync = async () => {
  if (isSyncRunning) {
    console.log('Fabric Pattern and Style Sync is already running. Skipping...');
    return;
  }

  isSyncRunning = true;

  try {
    console.log('Fabric Pattern and Style Sync started :: ', new Date().toISOString());

    await syncFabricPatternAndStyle();
  } catch (error) {
    console.error('Fabric Pattern and Style Sync failed :: ', error?.message);
  } finally {
    isSyncRunning = false;
  }
};

// Run once when server starts
runFabricPatternAndStyleSync();

// Run every 2 hours 10 minutes
setInterval(runFabricPatternAndStyleSync, CRON_INTERVAL);

module.exports = {
  syncFabricPatternAndStyle,
};
