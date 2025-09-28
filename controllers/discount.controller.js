const Discount = require("../modals/discount.model.js");
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");

// const bulkUpsertDiscounts = async (req, res, next) => {
//     try {
//         const payload = req.body;

//         if (!Array.isArray(payload) || payload.length === 0) {
//             return next(new ApiError(400, "Payload must be a non-empty array"));
//         }

//         let createdCount = 0;
//         let updatedCount = 0;

//         for (const item of payload) {
//             const { style_number, style_name, cost, mrp } = item;

//             if (!style_number || !style_name || !cost || !mrp) {
//                 return next(new ApiError(400, "Each item must contain style_number, style_name, cost and mrp"));
//             }

//             // check if style_number exists
//             const existing = await Discount.findOne({ style_number });

//             if (existing) {
//                 await Discount.updateOne(
//                     { style_number },
//                     { style_name, cost, mrp }
//                 );
//                 updatedCount++;
//             } else {
//                 await Discount.create({ style_number, style_name, cost, mrp });
//                 createdCount++;
//             }
//         }

//         return res
//             .status(200)
//             .json(new ApiResponse(200, "Bulk upsert completed successfully", { createdCount, updatedCount },));

//     } catch (error) {
//         return next(new ApiError(500, error.message || "Something went wrong while bulk upserting discounts"));
//     }
// };

const bulkUpsertDiscounts = async (req, res, next) => {
    try {
        const payload = req.body;

        if (!Array.isArray(payload) || payload.length === 0) {
            return next(new ApiError(400, "Payload must be a non-empty array"));
        }

        const operations = [];
        let ignoredCount = 0;

        for (const item of payload) {
            let { style_number, style_name, cost, mrp, current_selling_price } = item;

            // Ignore invalid style_number
            if (!style_number || isNaN(Number(style_number)) || !mrp || isNaN(Number(mrp)) || !cost
                || isNaN(Number(cost) || !current_selling_price || isNaN(Number(current_selling_price)))) {
                ignoredCount++;
                continue;
            }

            style_number = Number(style_number);

            // Set default values if missing
            if (!style_name) style_name = "Unknown";
            if (!cost) cost = 0;
            if (!mrp) mrp = 0;
            if (!current_selling_price) current_selling_price = 0;

            operations.push({
                updateOne: {
                    filter: { style_number },
                    update: { $set: { style_name, cost, mrp, current_selling_price } },
                    upsert: true // if not exist, insert
                }
            });
        }

        if (operations.length === 0) {
            return res.status(200).json(
                new ApiResponse(200, "No valid records to process", { ignoredCount })
            );
        }

        const result = await Discount.bulkWrite(operations);

        // bulkWrite returns info about inserted/modified counts
        const createdCount = result.upsertedCount || 0;
        const updatedCount = result.modifiedCount || 0;

        return res
            .status(200)
            .json(new ApiResponse(200, "Bulk upsert completed successfully", { createdCount, updatedCount, ignoredCount }));

    } catch (error) {
        return next(new ApiError(500, error.message || "Something went wrong while bulk upserting discounts"));
    }
};


const searchDiscounts = async (req, res, next) => {
    try {
        const { style_number } = req.query;

        let result;

        if (style_number) {
            // find specific style_number
            result = await Discount.findOne({ style_number: Number(style_number) });
            if (!result) {
                return next(new ApiError(404, `No discount found for style_number ${style_number}`));
            }
        } else {
            // return all documents
            result = await Discount.find();
        }

        return res.status(200).json(new ApiResponse(200, "Discounts fetched successfully", result));

    } catch (error) {
        return next(new ApiError(500, error.message || "Something went wrong while fetching discounts"));
    }
};


module.exports = { bulkUpsertDiscounts, searchDiscounts };
