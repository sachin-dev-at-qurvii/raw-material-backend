const Stock = require("../modals/stock.modal");
const Stock2 = require("../modals/stock2.modal");
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

    // Extract all fabric numbers
    const fabricNumbers = data.map(item => item.fabricNumber).filter(Boolean);

    // Fetch existing stocks in ONE query
    const existingStocks = await Stock.find({
      fabricNumber: { $in: fabricNumbers }
    }).lean();

    const existingMap = new Map(
      existingStocks.map(item => [item.fabricNumber, true])
    );

    let insertedCount = 0;
    let updatedCount = 0;

    const bulkOps = data.map(item => {
      const { fabricNumber, ...rest } = item;
      if (!fabricNumber) return null;

      const isExisting = existingMap.has(fabricNumber);

      if (isExisting) updatedCount++;
      else insertedCount++;

      return {
        updateOne: {
          filter: { fabricNumber },
          update: { $set: rest },
          upsert: true,
        },
      };
    }).filter(Boolean);

    // Run all updates in one shot
    await Stock.bulkWrite(bulkOps);

    const finalData = await Stock.find({
      fabricNumber: { $in: fabricNumbers }
    });

    return res.status(200).json(
      new ApiResponse(200, "Stocks processed successfully", {
        total: finalData.length,
        inserted: insertedCount,
        updated: updatedCount,
        data: finalData,
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
    const { fabric_source } = req.query;

    // 1️⃣ Find the existing stock
    const stock1 = await Stock.findById(stockId);
    if (!stock1) {
      throw new ApiError(404, "Stock not found");
    }

    // 2️⃣ Update stock with validation
    const updatedStock = await Stock.findByIdAndUpdate(stockId, updatedData, {
      new: true,
      runValidators: true,
    });

    // 3️⃣ Find related Stock2 using fabricNumber
    const stock2 = await Stock2.findOne({ fabricNumber: stock1.fabricNumber });

    if (stock2 && fabric_source === "Store2") {
      stock2.availableStock = 0; // if this is intentional
      await stock2.save();
    }

    // 4️⃣ Send success response
    res
      .status(200)
      .json(new ApiResponse(200, "Stock updated successfully", updatedStock));
  } catch (error) {
    next(error);
  }
};

//  ********************************** update stock with existing stock ****************************************

const addStockWithExistingStock = async (req, res, next) => {
  try {
    const { fabricNumber, stockQuantity } = req.body;

    if (!fabricNumber || stockQuantity == null) {
      return next(new ApiError(400, "Fabric number and stock quantity are required"));
    }

    const quantity = Number(stockQuantity);
    if (isNaN(quantity) || quantity < 0) {
      return next(new ApiError(400, "Stock quantity must be a valid number"));
    }

    // Overwrite existing stock instead of adding
    const updatedStock = await Stock.findOneAndUpdate(
      { fabricNumber: fabricNumber },
      {
        $set: {
          availableStock: quantity,  // overwrite instead of increment
          updatedAt: new Date()
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (!updatedStock) {
      return next(new ApiError(404, `Stock not found for fabric number: ${fabricNumber}`));
    }

    return res.status(200).json(
      new ApiResponse(200, updatedStock, "Stock overwritten successfully")
    );

  } catch (error) {
    next(error);
  }
};


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
module.exports = { getStock, createStock, updateStock, deleteStock, updateMultipleStocks, addStockWithExistingStock };


