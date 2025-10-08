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

const getMappedOrderIdsStyleNumber = async (req, res, next) => {
    try {
        const mappedOrderIds = await MappedOrderId.find();
        if (mappedOrderIds.length === 0) {
            return next(new ApiError(404, "mapped order id not found"));
        }
        return res.status(200).json(new ApiResponse(200, "Mapped order ids fetched successfully.", mappedOrderIds));
    } catch (error) {
        next(error);
    }
}


module.exports = { upsertMappedOrderIdWithStyleNumber, getMappedOrderIdsStyleNumber }