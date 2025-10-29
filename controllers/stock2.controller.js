const Stock2 = require("../modals/stock2.modal.js");
const ApiResponse = require("../utils/ApiResponse.js");
const ApiError = require("../utils/ApiError.js");

// ========================
//  GET ALL STOCKS (with search + pagination)
// ========================
const getAllStocks = async (req, res, next) => {
    try {
        const { search = "", page = 1, limit = 10 } = req.query;

        const query = {};

        // Search by fabricName, fabricNumber, or fabric_source
        if (search) {
            query.$or = [
                { fabricName: { $regex: search, $options: "i" } },
                { fabric_source: { $regex: search, $options: "i" } },
                { fabricNumber: isNaN(Number(search)) ? undefined : Number(search) },
            ].filter(Boolean); // remove undefined
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [stocks, total] = await Promise.all([
            Stock2.find(query).skip(skip).limit(Number(limit)),
            Stock2.countDocuments(query),
        ]);

        return res.status(200).json(new ApiResponse(200, {
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            stocks
        }, "Stock fetched successfully."))
    } catch (error) {
        next(error)
    }
};

// ========================
//  BULK CREATE OR UPDATE STOCKS
// ========================
const bulkCreateOrUpdateStock = async (req, res) => {
    try {
        const { stocks } = req.body;

        if (!Array.isArray(stocks) || stocks.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Stocks array is required",
            });
        }

        const bulkOps = stocks.map((item) => ({
            updateOne: {
                filter: {
                    fabricName: item.fabricName,
                    fabricNumber: item.fabricNumber,
                    location: item.location || "Default",
                },
                update: {
                    $set: {
                        fabric_source: item.fabric_source,
                    },
                    $setOnInsert: {
                        styleNumbers: item.styleNumbers || [],
                    },
                    $inc: {
                        availableStock: item.availableStock || 0,
                    },
                },
                upsert: true, // create if not exists
            },
        }));

        const result = await Stock2.bulkWrite(bulkOps);
        return res.status(200).json(new ApiResponse(200, result, "Stock processed successfully."));
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllStocks,
    bulkCreateOrUpdateStock,
};
