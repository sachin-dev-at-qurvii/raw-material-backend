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
        const updates = req.body;

        if (!accessory_number) {
            throw new ApiError(400, "Accessory number are required in params");
        }

        const updatedAccessory = await Accessory.findOneAndUpdate(
            { accessory_number },
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updatedAccessory) {
            throw new ApiError(404, "Accessory not found for given style and accessory number");
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedAccessory,
                    "Accessory updated successfully"
                )
            );
    } catch (error) {
        next(error);
    }
};




// ✅ Delete accessory
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
};
