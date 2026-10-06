const cron = require('node-cron');
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

cron.schedule('10 */2 * * *', async () => {
  console.log(`Fabric Pattern & Style Cron Started :: ${new Date().toISOString()}`);

  try {
    await syncFabricPatternAndStyle();
  } catch (error) {
    console.error('Fabric Pattern & Style Cron Failed :: ', error?.message);
  }
});

module.exports = {
  syncFabricPatternAndStyle,
};
