const Stock = require("../modals/stock.modal");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// get stock
const getStock = async (req, res, next) => {
  try {
    const { fabricNumber } = req.query;

    let stock;

    if (fabricNumber) {
      stock = await Stock.findOne({ fabricNumber: Number(fabricNumber) });


      if (!stock) {
        throw new ApiError(404, "Stock not found");
      }

      res.status(200).json(new ApiResponse(200, "Stock fetched successfully", stock));
    } else {
      stock = await Stock.find(); // return all stocks
      res.status(200).json(new ApiResponse(200, "All stocks fetched successfully", stock));
    }

  } catch (error) {
    next(error);
  }
};




const createStock = async (req, res, next) => {
  try {
    const data = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return next(new ApiError(400, "Payload must be non-empty array"));
    }

    let insertedCount = 0;
    let updatedCount = 0;
    const results = [];

    for (const item of data) {
      const { fabricNumber, ...rest } = item;
      if (!fabricNumber) continue;

      const existing = await Stock.findOne({ fabricNumber });

      const stock = await Stock.findOneAndUpdate(
        { fabricNumber },
        { $set: rest },
        { new: true, upsert: true }
      );

      if (existing) {
        updatedCount++;
      } else {
        insertedCount++;
      }

      results.push(stock);
    }

    return res.status(200).json(
      new ApiResponse(200, "Stocks processed successfully", {
        total: results.length,
        inserted: insertedCount,
        updated: updatedCount,
        data: results,
      })
    );
  } catch (error) {
    next(error);
  }
};


const updateStock = async (req, res, next) => {
  try {
    const stockId = req.params.id;
    const updatedData = req.body;

    const updatedStock = await Stock.findByIdAndUpdate(stockId, updatedData, { new: true, runValidators: true });

    if (!updatedData) {
      throw new ApiError(404, "Stock not found");
    }

    res.status(200).json(new ApiResponse(200, "Stock updated successfully", updatedStock));
  } catch (error) {
    next(error)
  }
}


// ******************** bulk update ****************************************
const updateMultipleStocks = async (req, res, next) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      throw new ApiError(400, "No updates provided");
    }

    // Create bulk operations array
    const bulkOps = updates.map(item => ({
      updateOne: {
        filter: { _id: item.id },
        update: { $set: { availableStock: item.availableStock } },
      },
    }));

    const result = await Stock.bulkWrite(bulkOps, { ordered: false });

    res
      .status(200)
      .json(new ApiResponse(200, "Bulk stock update successful", result));
  } catch (error) {
    next(error);
  }
};

// delete stock
const deleteStock = async (req, res, next) => {
  const stockId = req.params.id;
  const deletedStock = await Stock.findByIdAndDelete(stockId, { new: true });

  if (!deletedStock) {
    throw new ApiError(404, `Stock not found for delete`);
  }

  res.status(200).json(new ApiResponse(200, `${deletedStock.fabricNumber} deleted successfully`, deletedStock.fabricNumber))

}
module.exports = { getStock, createStock, updateStock, deleteStock,updateMultipleStocks };

