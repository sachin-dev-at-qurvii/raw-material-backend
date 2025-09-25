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



// const createStock = async (req, res, next) => {
//   try {
//     const data = req.body;

//     if (!Array.isArray(data) || data.length === 0) {
//       return next(new ApiError(400, "Payload must be non-empty array"));
//     }

//     // incomming fabric numbers
//     const fabricNumbers = data.map((fab) => fab.fabricNumber);

//     // DB me already kaunse fabricNumbers exist karte hain
//     const existingStocks = await Stock.find(
//       { fabricNumber: { $in: fabricNumbers } },
//       { fabricNumber: 1, _id: 0 }
//     );

//     const existingFabricNumbers = new Set(
//       existingStocks.map((stock) => stock.fabricNumber)
//     );

//     // unique fabric numbers
//     const newStocks = data.filter(
//       (fab) => !existingFabricNumbers.has(fab.fabricNumber)
//     );

//     if (newStocks.length === 0) {
//       return res.status(200).json(
//         new ApiResponse(200, "All fabricNumbers already exist, nothing to insert", {
//           created: [],
//           skipped: [...existingFabricNumbers],
//         })
//       );
//     }

//     // Insert only new unique stocks
//     const createdStocks = await Stock.insertMany(newStocks);

//     res.status(201).json(
//       new ApiResponse(201, "Stocks created successfully", {
//         created: createdStocks,
//         skipped: [...existingFabricNumbers],
//       })
//     );
//   } catch (error) {
//     next(error);
//   }
// };

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

// delete stock
const deleteStock = async (req, res, next) => {
  const stockId = req.params.id;
  const deletedStock = await Stock.findByIdAndDelete(stockId, { new: true });

  if (!deletedStock) {
    throw new ApiError(404, `Stock not found for delete`);
  }

  res.status(200).json(new ApiResponse(200, `${deletedStock.fabricNumber} deleted successfully`, deletedStock.fabricNumber))

}
module.exports = { getStock, createStock, updateStock, deleteStock };
