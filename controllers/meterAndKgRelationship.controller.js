const MeterAndKgRelationShip = require("../modals/meterAndKgRelationship.model.js");
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");

const addMeterAndKgRelationship = async (req, res, next) => {
    try {
        const payload = req.body;

        if (!Array.isArray(payload) || payload.length === 0) {
            return next(new ApiError(409, "Payload must be a non-empty array"));
        }

        const results = [];
        let newCount = 0;
        let updatedCount = 0;

        for (const fab of payload) {
            const { fabric_number, fabric_in_meter, fabric_in_KG } = fab;
            if (!fabric_number) continue;
            // check if already exists
            const existing = await MeterAndKgRelationShip.findOne({ fabric_number });

            const updatedDoc = await MeterAndKgRelationShip.findOneAndUpdate(
                { fabric_number },
                { $set: { fabric_in_meter, fabric_in_KG } },
                { new: true, upsert: true }
            );

            if (existing) {
                updatedCount++;
            } else {
                newCount++;
            }

            results.push(updatedDoc);
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    `Fabric relationship(s) processed successfully.`,
                    {
                        total: results.length,
                        inserted: newCount,
                        updated: updatedCount,
                        data: results,
                    }
                )
            );

    } catch (error) {
        next(error);
    }
};
const getMeterAndKgRelationshiop = async (req, res, next) => {
    try {
        const records = await MeterAndKgRelationShip.find();
        if (!records) {
            return next(new ApiError(404, "Relationship data fetched successfully."));
        }
        return res.status(200).json(new ApiResponse(200, `${records.length} record(s) fetched successfully.`, records));
    } catch (error) {
        next(error);
    }
}

module.exports = { addMeterAndKgRelationship, getMeterAndKgRelationshiop };
