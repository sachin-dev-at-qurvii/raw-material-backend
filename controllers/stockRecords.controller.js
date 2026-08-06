const StockRecords = require('../modals/stockRecords.model.js');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Stock = require('../modals/stock.modal.js');

/**
 * GET /verify-stocks?page=&limit=
 * Frontend: fetchStockLogRecords()
 * Returns paginated list of stock records awaiting verification.
 */
const getVerifyStocks = async (req, res, next) => {
  let { page, limit } = req.query;
  page = parseInt(page) || 1;
  limit = parseInt(limit) || 50;
  const skip = (page - 1) * limit;

  try {
    const totalRecords = await StockRecords.countDocuments();
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    const stockRecords = await StockRecords.find().sort({ _id: -1 }).skip(skip).limit(limit);

    res.status(200).json(
      new ApiResponse(200, 'Stock records retrieved successfully', {
        stockRecords,
        totalPages,
        currentPage: page,
      })
    );
  } catch (error) {
    next(error);
  }
};

const getVerifyStocksBySessionId = async (req, res, next) => {
  let { page, limit } = req.query;
  let { session_id } = req.params;

  if (!session_id) {
    return res.status(400).json(new ApiError(400, 'session_id is required'));
  }

  session_id = parseInt(session_id);

  if (isNaN(session_id)) {
    return res.status(400).json(new ApiError(400, 'Invalid session_id'));
  }

  page = parseInt(page) || 1;
  limit = parseInt(limit) || 50;

  const skip = (page - 1) * limit;

  try {
    const totalRecords = await StockRecords.countDocuments({ session_id });
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    const stockRecords = await StockRecords.find({ session_id })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit);
    if (stockRecords.length === 0) {
      return res.status(404).json(new ApiError(404, 'Stock records not found'));
    }

    res.status(200).json(
      new ApiResponse(200, `Stock records retrieved successfully for session_id ${session_id}`, {
        stockRecords,
        totalRecords,
        totalPages,
        currentPage: page,
      })
    );
  } catch (error) {
    next(error);
  }
};
/**
 * POST /verify-stocks
 *
 */

const createVerifyStocks = async (req, res, next) => {
  try {
    const {
      fabric_number,
      fabric_name,
      employee_number,
      location,
      session_id,
      old_stock,
      added_stock,
      source,
      width,
    } = req.body;
    if (
      !fabric_number ||
      !fabric_name ||
      !employee_number ||
      !location ||
      !session_id ||
      
      !source ||
      !width
    ) {
      return res.status(400).json(new ApiError(400, 'All fields are required'));
    }

    const createdVerifyStocks = await StockRecords.create({
      fabric_number,
      fabric_name,
      employee_number,
      location,
      session_id,
      old_stock,
      added_stock,
      source,
      width,
    });
    return res
      .status(201)
      .json(new ApiResponse(201, 'Verify Stocks created successfully', createdVerifyStocks));
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /verify-stocks/:id/approve
 * Frontend: handleApprove()
 */
const approveStockLog = async (req, res, next) => {
  const { id } = req.params;
  try {
    const record = await StockRecords.findById(id);
    if (!record) {
      return next(new ApiError(404, 'Stock record not found'));
    }
    if (record.is_stock_added === true) {
      return next(new ApiError(400, 'Cannot approve: Stock is already added'));
    }

    let stock = await Stock.findOne({ fabricNumber: record.fabric_number });

    if (record.source === 'stock_keeping') {
      if (!stock) {
        stock = new Stock({ fabricNumber: record.fabric_number });
      }
      stock.availableStock = record.added_stock;
      stock.location = record.location;
      stock.fabric_source = record.source;
      await stock.save();
    } else if (record.source === 'vendor') {
      if (!stock) {
        return next(new ApiError(400, 'Stock record not found for this fabric number'));
      }
      stock.availableStock += record.added_stock;
      stock.location = record.location;
      stock.fabric_source = record.source;
      await stock.save();
    } else {
      return next(new ApiError(400, `Unknown source: ${record.source}`));
    }

    // ⚠️ Stock table update ho chuki hai. Ab record update karo —
    // agar ye step fail ho jaye to stock badh gaya lekin record "pending" reh jayega.
    record.status = 'approved';
    record.is_stock_added = true;
    await record.save();

    res.status(200).json(new ApiResponse(200, 'Record approved successfully', record));
  } catch (error) {
    next(error);
  }
};
/**
 * PUT /verify-stocks/:id/reject
 * Frontend: handleReject()
 */
const rejectStockLog = async (req, res, next) => {
  const { id } = req.params;
  try {
    const record = await StockRecords.findById(id);
    if (!record) {
      return next(new ApiError(404, 'Stock record not found'));
    }

    if (record.status === 'rejected') {
      return next(new ApiError(400, 'Record is already rejected'));
    }

    if (record.is_stock_added) {
      const stock = await Stock.findOne({ fabricNumber: record.fabric_number });

      if (!stock) {
        return next(
          new ApiError(
            400,
            `Stock not found for fabric number: ${record.fabric_number}, cannot reverse stock`
          )
        );
      }

      if (record.source === 'stock_keeping') {
        stock.availableStock = 0;
      } else if (record.source === 'vendor') {
        stock.availableStock = Math.max(0, stock.availableStock - record.added_stock);
      } else {
        return next(new ApiError(400, `Unknown source: ${record.source}`));
      }

      stock.fabric_source = record.source;
      await stock.save();
      record.is_stock_added = false;
    }

    record.status = 'rejected';
    await record.save();

    res.status(200).json(new ApiResponse(200, 'Record rejected successfully', record));
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /verify-stocks/:id
 * Frontend: handleSaveEdit()  -> body: { added_stock, location, status, width }
 * Uses .save() (not findByIdAndUpdate) so the pre('save') hook recalculates current_stock.
 */
const updateStockLog = async (req, res, next) => {
  const { id } = req.params;
  const { added_stock, location, status, width } = req.body;
  try {
    const record = await StockRecords.findById(id);
    if (!record) {
      return next(new ApiError(404, 'Stock record not found'));
    }
    if (added_stock !== undefined && added_stock !== '') record.added_stock = added_stock;
    if (location !== undefined && location !== '') record.location = location;
    if (status !== undefined && status !== '') record.status = status;
    if (width !== undefined && width !== '') record.width = width;

    await record.save(); // current_stock = old_stock + added_stock recalculated here
    res.status(200).json(new ApiResponse(200, 'Record updated successfully', record));
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /verify-stocks/bulk-approve
 * Frontend: handleBulkApprove()  -> body: { ids }
 * No stock-quantity fields change here, so updateMany is safe (no need for current_stock recalc).
 */

const bulkApproveStockLogs = async (req, res, next) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new ApiError(400, 'Invalid input: ids must be a non-empty array'));
  }

  try {
    const recordsToApprove = await StockRecords.find({
      _id: { $in: ids },
      is_stock_added: false,
    }).sort({ createdAt: 1 });

    if (recordsToApprove.length === 0) {
      return next(
        new ApiError(
          400,
          'No valid records found to approve. Only records where stock is not added can be approved.'
        )
      );
    }

    const fabricNumbers = [...new Set(recordsToApprove.map((r) => r.fabric_number))];
    const existingStocks = await Stock.find({ fabricNumber: { $in: fabricNumbers } });

    const stockMap = new Map();
    existingStocks.forEach((s) => stockMap.set(s.fabricNumber, s));

    const approvedIds = [];
    const failedRecords = [];

    for (const record of recordsToApprove) {
      const existing = stockMap.get(record.fabric_number);

      if (record.source === 'stock_keeping') {
        stockMap.set(record.fabric_number, {
          ...existing,
          fabricNumber: record.fabric_number,
          availableStock: record.added_stock,
          location: record.location,
          fabric_source: record.source,
        });
        approvedIds.push(record._id);
      } else if (record.source === 'vendor') {
        if (!existing) {
          failedRecords.push({
            id: record._id,
            reason: `Stock not found for fabric number: ${record.fabric_number}`,
          });
          continue;
        }
        stockMap.set(record.fabric_number, {
          ...existing,
          availableStock: (existing.availableStock || 0) + record.added_stock,
          location: record.location,
          fabric_source: record.source,
        });
        approvedIds.push(record._id);
      } else {
        failedRecords.push({ id: record._id, reason: `Unknown source "${record.source}"` });
      }
    }

    const touchedFabricNumbers = [
      ...new Set(
        recordsToApprove.filter((r) => approvedIds.includes(r._id)).map((r) => r.fabric_number)
      ),
    ];

    const stockBulkOps = touchedFabricNumbers.map((fabricNumber) => {
      const finalStock = stockMap.get(fabricNumber);
      return {
        updateOne: {
          filter: { fabricNumber },
          update: {
            $set: {
              availableStock: finalStock.availableStock,
              location: finalStock.location,
              fabric_source: finalStock.fabric_source,
            },
          },
          upsert: true,
        },
      };
    });

    // ⚠️ No transaction: agar ye step fail ho aur record update na ho pe,
    // to stock update ho jayega lekin record "pending" reh jayega.
    if (stockBulkOps.length > 0) {
      await Stock.bulkWrite(stockBulkOps);
    }

    if (approvedIds.length > 0) {
      await StockRecords.updateMany(
        { _id: { $in: approvedIds } },
        { $set: { status: 'approved', is_stock_added: true } }
      );
    }

    const skippedRecords = await StockRecords.find({
      _id: { $in: ids },
      is_stock_added: true,
      _id: { $nin: approvedIds },
    });

    res.status(200).json(
      new ApiResponse(200, 'Bulk approve processed', {
        totalRequested: ids.length,
        approvedCount: approvedIds.length,
        approvedIds,
        failedCount: failedRecords.length,
        failedRecords,
        skippedCount: skippedRecords.length,
        skippedIds: skippedRecords.map((r) => r._id),
        message:
          failedRecords.length > 0
            ? `${approvedIds.length} approved, ${failedRecords.length} failed, ${skippedRecords.length} skipped`
            : skippedRecords.length > 0
              ? `${skippedRecords.length} record(s) skipped because stock is already added`
              : 'All records approved successfully',
      })
    );
  } catch (error) {
    next(error);
  }
};
/**
 * PUT /verify-stocks/bulk-reject
 * Frontend: handleBulkReject()  -> body: { ids }
 */
const bulkRejectStockLogs = async (req, res, next) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new ApiError(400, 'Invalid input: ids must be a non-empty array'));
  }

  try {
    const records = await StockRecords.find({
      _id: { $in: ids },
      status: { $ne: 'rejected' },
    }).sort({ createdAt: 1 });

    if (records.length === 0) {
      return next(new ApiError(400, 'No valid records found to reject.'));
    }

    const recordsWithStock = records.filter((r) => r.is_stock_added === true);
    const recordsWithoutStock = records.filter((r) => r.is_stock_added === false);

    const approvedIds = [];
    const failedRecords = [];
    let stockBulkOps = [];

    if (recordsWithStock.length > 0) {
      const fabricNumbers = [...new Set(recordsWithStock.map((r) => r.fabric_number))];
      const existingStocks = await Stock.find({ fabricNumber: { $in: fabricNumbers } });

      const stockMap = new Map();
      existingStocks.forEach((s) => stockMap.set(s.fabricNumber, s));

      for (const record of recordsWithStock) {
        const existing = stockMap.get(record.fabric_number);

        if (!existing) {
          failedRecords.push({
            id: record._id,
            reason: `Stock not found for fabric number: ${record.fabric_number}, cannot reverse stock`,
          });
          continue;
        }

        if (record.source === 'stock_keeping') {
          stockMap.set(record.fabric_number, {
            ...existing,
            availableStock: 0,
            fabric_source: record.source,
          });
        } else if (record.source === 'vendor') {
          const newAvailable = Math.max(0, (existing.availableStock || 0) - record.added_stock);
          stockMap.set(record.fabric_number, {
            ...existing,
            availableStock: newAvailable,
            fabric_source: record.source,
          });
        } else {
          failedRecords.push({ id: record._id, reason: `Unknown source "${record.source}"` });
          continue;
        }

        approvedIds.push(record._id);
      }

      const touchedFabricNumbers = [
        ...new Set(
          recordsWithStock.filter((r) => approvedIds.includes(r._id)).map((r) => r.fabric_number)
        ),
      ];

      stockBulkOps = touchedFabricNumbers.map((fabricNumber) => {
        const finalStock = stockMap.get(fabricNumber);
        return {
          updateOne: {
            filter: { fabricNumber },
            update: {
              $set: {
                availableStock: finalStock.availableStock,
                fabric_source: finalStock.fabric_source,
              },
            },
          },
        };
      });
    }

    recordsWithoutStock.forEach((r) => approvedIds.push(r._id));

    if (stockBulkOps.length > 0) {
      await Stock.bulkWrite(stockBulkOps);
    }

    let result = { modifiedCount: 0 };
    if (approvedIds.length > 0) {
      result = await StockRecords.updateMany(
        { _id: { $in: approvedIds } },
        { $set: { status: 'rejected', is_stock_added: false } }
      );
    }

    const alreadyRejectedIds = ids.filter(
      (id) => !records.some((r) => r._id.toString() === id.toString())
    );

    res.status(200).json(
      new ApiResponse(200, 'Bulk reject processed', {
        totalRequested: ids.length,
        rejectedCount: result.modifiedCount,
        rejectedIds: approvedIds,
        failedCount: failedRecords.length,
        failedRecords,
        alreadyRejectedCount: alreadyRejectedIds.length,
        alreadyRejectedIds,
        message:
          failedRecords.length > 0
            ? `${result.modifiedCount} rejected, ${failedRecords.length} failed`
            : 'All valid records rejected successfully',
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /verify-stocks/bulk-edit
 * Frontend: handleBulkEdit()  -> body: { ids, data: { added_stock, location, status, width } }
 * NOTE: iterates + calls .save() on each doc (instead of updateMany) so that when
 * added_stock changes, the pre('save') hook correctly recalculates current_stock
 * per-record (old_stock differs per document, so a single updateMany can't do this).
 */
const bulkEditStockLogs = async (req, res, next) => {
  const { ids, data } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return next(new ApiError(400, 'Invalid input: ids must be a non-empty array'));
  }
  try {
    const records = await StockRecords.find({ _id: { $in: ids } });

    for (const record of records) {
      if (data?.added_stock !== undefined && data.added_stock !== '')
        record.added_stock = data.added_stock;
      if (data?.location !== undefined && data.location !== '') record.location = data.location;
      if (data?.status !== undefined && data.status !== '') record.status = data.status;
      if (data?.width !== undefined && data.width !== '') record.width = data.width;
      await record.save();
    }

    res
      .status(200)
      .json(
        new ApiResponse(200, 'Records updated successfully', { modifiedCount: records.length })
      );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getVerifyStocks,
  approveStockLog,
  rejectStockLog,
  updateStockLog,
  bulkApproveStockLogs,
  bulkRejectStockLogs,
  bulkEditStockLogs,
  createVerifyStocks,
  getVerifyStocksBySessionId,
};
