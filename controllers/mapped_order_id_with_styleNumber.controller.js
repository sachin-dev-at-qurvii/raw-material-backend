const MappedOrderId = require("../modals/mapped_orderid_with_styleNumber.model");
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");

const upsertMappedOrderIdWithStyleNumber = async (req, res, next) => {
    try {
        const payload = req.body;
        if (!Array.isArray(payload) || payload.length === 0) {
            return next(new ApiError(400, "Payload must be a non-empty array"));
        }

        const bulkOps = payload.map(item => {
            const { order_id, style_number, size, color, rack_space, inStock } = item;
            return {
                updateOne: {
                    filter: { order_id },
                    update: {
                        $set: {
                            order_id,
                            color,
                            inStock,
                            rack_space,
                            style_number,
                            size
                        }
                    },
                    upsert: true
                }
            };
        });
        const upserted = await MappedOrderId.bulkWrite(bulkOps);

        res.status(200).json(new ApiResponse(200, "Upsert operation completed successfully.", upserted));
    } catch (error) {
        next(error);
    }
}

// ******************* get mapped order ids records ********************************

const getMappedOrderIdsStyleNumber = async (req, res, next) => {
    try {
        const { page = 1, style_number, rack_space } = req.query;

        const limit = 50;
        const skip = (Number(page) - 1) * limit;

        // Build Filter
        const filter = {};

        // Filter by style_number (Number type)
        if (style_number) {
            filter.style_number = Number(style_number); // exact match
        }

        // Filter by rack_space (String + partial match)
        if (rack_space) {
            filter.rack_space = { $regex: new RegExp(rack_space, "i") };
        }

        // Get total count
        const totalRecords = await MappedOrderId.countDocuments(filter);

        // Fetch paginated data
        const mappedOrderIds = await MappedOrderId.find(filter)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })
            .lean();

        if (mappedOrderIds.length === 0) {
            return next(new ApiError(404, "No mapped order IDs found"));
        }

        return res.status(200).json(
            new ApiResponse(200, `${mappedOrderIds.length} Mapped order IDs fetched successfully.`, {
                page: Number(page),
                per_page: limit,
                total_records: totalRecords,
                total_pages: Math.ceil(totalRecords / limit),
                data: mappedOrderIds,
            })
        );
    } catch (error) {
        next(error);
    }
};





const getRackSpaceDetails = async (req, res, next) => {
    const { order_id } = req.query;
    try {
        const rackSpaceDetails = await MappedOrderId.findOne({ order_id: Number(order_id) });
        if (!rackSpaceDetails) {
            return next(new ApiError(404, "Rack Space details not found"));
        }
        res.status(200).json(new ApiResponse(200, rackSpaceDetails, "Rack Space details fetched successfully."));
    } catch (error) {
        next(error);
    }
}




module.exports = { upsertMappedOrderIdWithStyleNumber, getMappedOrderIdsStyleNumber, getRackSpaceDetails }
