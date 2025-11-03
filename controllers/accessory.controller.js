const Accessory = require("../modals/accessoryStock.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// ✅ Create new accessory
const createAccessory = async (req, res, next) => {
    try {
        const { style_number, accessory_number, accessory_name, accessorry_type, stock_unit, accessory_image } = req.body;

        if (!style_number || !accessory_number) {
            throw new ApiError(400, "Style number and accessory number are required");
        }

        const existing = await Accessory.findOne({
            style_number,
            accessory_number
        });

        if (existing) {
            throw new ApiError(409, "Accessory with this style and accessory number already exists");
        }

        const accessory = await Accessory.create({
            style_number,
            accessory_number,
            accessory_name,
            accessorry_type,
            stock_unit,
            accessory_image
        });

        return res
            .status(201)
            .json(new ApiResponse(201, accessory, "Accessory created successfully"));
    } catch (error) {
        next(error);
    }
};

// ✅ Get all accessories (with optional filters and pagination)
const getAllAccessories = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search = "" } = req.query;

        const query = search
            ? {
                $or: [
                    { accessory_number: { $regex: search, $options: "i" } },
                    { accessory_name: { $regex: search, $options: "i" } },
                    { accessorry_type: { $regex: search, $options: "i" } },
                    // { style_number: { $regex: search, $options: "i" } },
                ],
            }
            : {};

        const accessories = await Accessory.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Accessory.countDocuments(query);

        return res
            .status(200)
            .json(
                new ApiResponse(200, "Accessories fetched successfully", { total, page: Number(page), accessories })
            );
    } catch (error) {
        next(error);
    }
};

// ✅ Get single accessory by ID
const getAccessoryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const accessory = await Accessory.findById(id);

        if (!accessory) throw new ApiError(404, "Accessory not found");

        return res
            .status(200)
            .json(new ApiResponse(200, "Accessory fetched successfully", accessory));
    } catch (error) {
        next(error);
    }
};



const updateAccessory = async (req, res, next) => {
    try {
        const { accessory_number } = req.params;
        const { stock_unit } = req.body;

        if (!accessory_number) {
            throw new ApiError(400, "Accessory number is required in params");
        }

        if (stock_unit === undefined) {
            throw new ApiError(400, "stock_unit is required in body");
        }

        // Update all accessories having the same accessory_number
        const result = await Accessory.updateMany(
            { accessory_number },
            { $set: { stock_unit } }
        );

        // result looks like: { acknowledged: true, matchedCount: X, modifiedCount: Y }
        if (result.matchedCount === 0) {
            throw new ApiError(404, "No accessories found with given accessory_number");
        }

        return res.status(200).json(
            new ApiResponse(
                200,
                result,
                "Stock updated successfully for all matching accessories"
            )
        );
    } catch (error) {
        next(error);
    }
};





// ******************************* UPDATE ACCESSORY STOCK BY STYLE NUMBERS *******************************

console.log("first")
// const updateAccessoryByStyleNumber = async (req, res, next) => {
//     try {
//         const styleNumbers = req.body;

//         if (!Array.isArray(styleNumbers) || styleNumbers.length === 0) {
//             return next(new ApiError(400, "Style numbers must be a non-empty array"));
//         }

//         // Find all accessories matching the given style numbers
//         const accessories = await Accessory.find({
//             style_number: { $in: styleNumbers }
//         });

//         if (accessories.length === 0) {
//             return next(new ApiError(404, "No accessories found for given style numbers"));
//         }

//         // Filter out items whose stock_unit is already 0 or less
//         const validAccessories = accessories.filter(acc => acc.stock_unit > 0);

//         if (validAccessories.length === 0) {
//             return next(new ApiError(400, "All given accessories are out of stock"));
//         }

//         // Prepare bulk operations only for valid ones
//         const operations = validAccessories.map(acc => ({
//             updateOne: {
//                 filter: { style_number: acc.style_number },
//                 update: { $inc: { stock_unit: -1 } }
//             }
//         }));

//         const result = await Accessory.bulkWrite(operations);

//         return res.status(200).json(
//             new ApiResponse(
//                 200,
//                 {
//                     updatedCount: result.modifiedCount,
//                     skippedCount: styleNumbers.length - validAccessories.length,
//                 },
//                 "Accessory stocks updated successfully"
//             )
//         );
//     } catch (error) {
//         next(error);
//     }
// };




// ✅ Delete accessory
const updateAccessoryByStyleNumber = async (req, res, next) => {
    try {
        const styleNumbers = req.body;

        if (!Array.isArray(styleNumbers) || styleNumbers.length === 0) {
            return next(new ApiError(400, "Style numbers must be a non-empty array"));
        }

        // 1️⃣ Count how many times each style_number appears
        const styleCountMap = {};
        for (const style of styleNumbers) {
            styleCountMap[style] = (styleCountMap[style] || 0) + 1;
        }

        // 2️⃣ Find all accessories matching those styles
        const accessories = await Accessory.find({
            style_number: { $in: Object.keys(styleCountMap).map(Number) }
        });

        if (accessories.length === 0) {
            return next(new ApiError(404, "No accessories found for given style numbers"));
        }

        // 3️⃣ Build count map per accessory_number
        const accessoryCountMap = {};
        for (const acc of accessories) {
            const styleCount = styleCountMap[acc.style_number] || 0; // how many times this style appeared
            accessoryCountMap[acc.accessory_number] =
                (accessoryCountMap[acc.accessory_number] || 0) + styleCount;
        }

        // 4️⃣ Prepare bulk operations
        const operations = [];

        for (const [accessory_number, count] of Object.entries(accessoryCountMap)) {
            const anyAccessory = accessories.find(a => a.accessory_number === accessory_number);

            if (!anyAccessory) continue;
            if (anyAccessory.stock_unit <= 0) continue;

            const newStock = Math.max(anyAccessory.stock_unit - count, 0); // avoid negative stock

            operations.push({
                updateMany: {
                    filter: { accessory_number },
                    update: { $set: { stock_unit: newStock } }
                }
            });
        }

        if (operations.length === 0) {
            return next(new ApiError(400, "All given accessories are out of stock or invalid"));
        }

        const result = await Accessory.bulkWrite(operations);

        // 5️⃣ Refetch updated accessories
        const updatedAccessories = await Accessory.find({
            style_number: { $in: Object.keys(styleCountMap).map(Number) }
        });

        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    updatedCount: result.modifiedCount,
                    updatedAccessories
                },
                "Accessory stocks reduced correctly and synchronized successfully"
            )
        );

    } catch (error) {
        next(error);
    }
};



const deleteAccessory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedAccessory = await Accessory.findByIdAndDelete(id);
        if (!deletedAccessory) throw new ApiError(404, "Accessory not found");

        return res
            .status(200)
            .json(new ApiResponse(200, "Accessory deleted successfully", deleteAccessory));
    } catch (error) {
        next(error);
    }
};

// ✅ Bulk upload or update accessories (for CSV upload)
const bulkUpsertAccessories = async (req, res, next) => {
    try {
        const { accessories } = req.body;

        if (!Array.isArray(accessories) || accessories.length === 0) {
            throw new ApiError(400, "Accessories array is required");
        }

        // 🧩 Map CSV data → DB format
        const bulkOps = accessories.map((item) => ({
            updateOne: {
                filter: {
                    style_number: Number(item.style_number),
                    accessory_number: item.accessory_number,
                },
                update: {
                    $set: {
                        style_number: Number(item.style_number),
                        accessory_number: item.accessory_number,
                        accessory_name: item.accessory_name,
                        accessorry_type: item.accessorry_type,
                    },
                },
                upsert: true,
            },
        }));

        const result = await Accessory.bulkWrite(bulkOps);

        return res
            .status(200)
            .json(new ApiResponse(200, "Accessories bulk upsert successful", result));
    } catch (error) {
        next(error);
    }
};




module.exports = {
    createAccessory,
    getAllAccessories,
    getAccessoryById,
    updateAccessory,
    deleteAccessory,
    bulkUpsertAccessories,
    updateAccessoryByStyleNumber
};
