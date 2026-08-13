const StockLog = require('../modals/stockLog.model.js');
const ApiError = require('../utils/ApiError.js');
const ApiResponse = require('../utils/ApiResponse.js');
const StockRecords = require('../modals/stockRecords.model.js');

const getAllStockLog = async (req, res, next) => {
  const { limit, page } = req.query;
  const parsedLimit = parseInt(limit) || 25;
  const parsedPage = parseInt(page) || 1;
  const totalRecords = await StockLog.countDocuments();
  const totalPages = Math.ceil(totalRecords / parsedLimit);
  const skip = (parsedPage - 1) * parsedLimit;
  try {
    const stockLogs = await StockLog.find()
      .sort({
        approved: 1,
      })
      .skip(skip)
      .limit(parsedLimit);
    res.status(200).json(
      new ApiResponse(200, 'Stock logs retrieved successfully', {
        stockLogs,
        totalPages,
        currentPage: parsedPage,
      })
    );
  } catch (error) {
    next(error);
  }
};

const updateStockLogStatus = async (req, res, next) => {
  const { id } = req.params;
  const { approved } = req.body;
  try {
    const stockLog = await StockLog.findById(id);
    if (!stockLog) {
      return next(new ApiError(404, 'Stock log not found'));
    }
    stockLog.approved = approved;
    await stockLog.save();
    res.status(200).json(new ApiResponse(200, 'Stock log updated successfully', stockLog));
  } catch (error) {
    next(error);
  }
};

const endSession = async (req, res, next) => {
  const { session_id } = req.body;
  if (!session_id) {
    return next(new ApiError(400, 'Session ID is required'));
  }
  try {
    const stockRecord = await StockRecords.findOne({ session_id });
    if (!stockRecord) {
      return next(new ApiError(404, 'Stock record not found for the given session ID'));
    }
    const createdLog = await StockLog.create({
      log_id: stockRecord.session_id,
      source: stockRecord.source,
    });

    res.status(200).json(new ApiResponse(200, 'Session ended successfully', createdLog));
  } catch (error) {
    next(error);
  }
};

const autoApproveEligibleLogs = async (req, res, next) => {
  try {
    const startTime = Date.now();

    // Find eligible logs using aggregation
    const eligibleLogs = await StockLog.aggregate([
      // Match only pending logs
      { $match: { approved: false } },

      // Lookup records
      {
        $lookup: {
          from: 'stockrecords', // Make sure collection name is correct
          localField: 'log_id',
          foreignField: 'session_id',
          as: 'records',
        },
      },

      // Add record counts
      {
        $addFields: {
          totalRecords: { $size: '$records' },
          pendingRecords: {
            $size: {
              $filter: {
                input: '$records',
                as: 'r',
                cond: { $eq: ['$$r.status', 'pending'] },
              },
            },
          },
        },
      },

      // Filter eligible (no pending records and has at least one record)
      {
        $match: {
          pendingRecords: 0,
          totalRecords: { $gt: 0 },
        },
      },

      // Project only ID
      { $project: { _id: 1 } },
    ]);

    // If no eligible logs found
    if (eligibleLogs.length === 0) {
      return res.status(200).json(
        new ApiResponse(200, 'No eligible logs found for auto-approval', {
          success: true,
          approved: 0,
          message: 'All pending logs have pending records or no records',
        })
      );
    }

    // Extract IDs
    const eligibleIds = eligibleLogs.map((log) => log._id);

    // UPDATE MANY - Single update query
    const updateResult = await StockLog.updateMany(
      { _id: { $in: eligibleIds } },
      { $set: { approved: true } }
    );

    const endTime = Date.now();
    const executionTime = (endTime - startTime) / 1000;

    // Get still pending count
    const stillPending = await StockLog.countDocuments({ approved: false });

    // Get details of approved logs (optional - for response)
    const approvedLogs = await StockLog.find(
      { _id: { $in: eligibleIds } },
      { _id: 1, log_id: 1, source: 1 }
    ).lean();

    res.status(200).json(
      new ApiResponse(200, 'Auto-approval completed successfully', {
        summary: {
          eligibleFound: eligibleLogs.length,
          approved: updateResult.modifiedCount,
          stillPending: stillPending,
          executionTime: `${executionTime.toFixed(2)} seconds`,
          queriesUsed: 3,
        },
        details: {
          approvedLogs: approvedLogs.slice(0, 20),
          totalApprovedLogs: approvedLogs.length,
        },
      })
    );
  } catch (error) {
    console.error('Auto-approval error:', error);
    next(error);
  }
};

module.exports = {
  getAllStockLog,
  updateStockLogStatus,
  endSession,
  autoApproveEligibleLogs,
};
