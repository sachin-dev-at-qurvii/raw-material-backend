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

const autoApproveEligibleLogs = async (req, res, next) => {};

module.exports = {
  getAllStockLog,
  updateStockLogStatus,
  endSession,
  autoApproveEligibleLogs,
};
