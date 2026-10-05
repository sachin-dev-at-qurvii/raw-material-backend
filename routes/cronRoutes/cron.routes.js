const express = require('express');
const ApiError = require('../../utils/ApiError');
const { syncStyleFabricMapping } = require('../../cron/styleFabricMappingSync.cron');
const ApiResponse = require('../../utils/ApiResponse');
const { syncFabricPatternAndStyle } = require('../../cron/fabricPatternAndStyleSync.cron');
const { syncFabricAverage } = require('../../cron/fabricAverageSync.cron');
const router = express.Router();

router.get('/sync-style-fabric-mapping', async (req, res) => {
  try {
    const result = await syncStyleFabricMapping();
    res.status(200).json(new ApiResponse(200, 'Style-Fabric mapping synced successfully', result));
  } catch (error) {
    console.error('Error syncing style-fabric mapping:', error);
    throw new ApiError(500, 'Failed to sync style-fabric mapping', error.message);
  }
});

router.get('/sync-fabric-pattern-and-style', async (req, res) => {
  try {
    const result = await syncFabricPatternAndStyle();
    res
      .status(200)
      .json(new ApiResponse(200, 'Fabric pattern and style synced successfully', result));
  } catch (error) {
    console.error('Error syncing fabric pattern and style:', error);
    throw new ApiError(500, 'Failed to sync fabric pattern and style', error.message);
  }
});

router.get('/sync-fabric-average', async (req, res) => {
  try {
    const result = await syncFabricAverage();
    res.status(200).json(new ApiResponse(200, 'Fabric average synced successfully', result));
  } catch (error) {
    console.error('Error syncing fabric average:', error);
    throw new ApiError(500, 'Failed to sync fabric average', error.message);
  }
});

module.exports = router;
