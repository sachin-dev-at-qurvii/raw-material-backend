const MeterAndKgRelationShip = require("../modals/meterAndKgRelationship.model.js");
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");

// const addMeterAndKgRelationship = async (req, res, next) => {
//     try {
//         const payload = req.body;

//         if (!Array.isArray(payload) || payload.length === 0) {
//             return next(new ApiError(409, "Payload must be a non-empty array"));
//         }

//         const results = [];
//         let newCount = 0;
//         let updatedCount = 0;

//         for (const fab of payload) {
//             const { fabric_number, fabric_in_meter, fabric_in_KG } = fab;
//             if (!fabric_number) continue;
//             // check if already exists
//             const existing = await MeterAndKgRelationShip.findOne({ fabric_number });

//             const updatedDoc = await MeterAndKgRelationShip.findOneAndUpdate(
//                 { fabric_number },
//                 { $set: { fabric_in_meter, fabric_in_KG } },
//                 { new: true, upsert: true }
//             );

//             if (existing) {
//                 updatedCount++;
//             } else {
//                 newCount++;
//             }

//             results.push(updatedDoc);
//         }

//         return res
//             .status(201)
//             .json(
//                 new ApiResponse(
//                     201,
//                     `Fabric relationship(s) processed successfully.`,
//                     {
//                         total: results.length,
//                         inserted: newCount,
//                         updated: updatedCount,
//                         data: results,
//                     }
//                 )
//             );

//     } catch (error) {
//         next(error);
//     }
// };
const addMeterAndKgRelationship = async (req, res, next) => {
    try {
        const payload = req.body;

        if (!Array.isArray(payload) || payload.length === 0) {
            return next(new ApiError(409, "Payload must be a non-empty array"));
        }

        // Prepare bulk operations
        const bulkOps = payload
            .filter(fab => fab.fabric_number) // skip invalid
            .map(fab => ({
                updateOne: {
                    filter: { fabric_number: fab.fabric_number },
                    update: { $set: { fabric_in_meter: fab.fabric_in_meter, fabric_in_KG: fab.fabric_in_KG } },
                    upsert: true,
                },
            }));

        if (bulkOps.length === 0) {
            return res.status(400).json(new ApiResponse(400, "No valid fabric numbers to process."));
        }

        const bulkWriteResult = await MeterAndKgRelationShip.bulkWrite(bulkOps);

        // Extract counts
        const insertedCount = bulkWriteResult.upsertedCount;
        const modifiedCount = bulkWriteResult.modifiedCount;

        return res.status(201).json(
            new ApiResponse(201, "Fabric relationship(s) processed successfully.", {
                total: payload.length,
                inserted: insertedCount,
                updated: modifiedCount,
            })
        );

    } catch (error) {
        next(error);
    }
};

const getMeterAndKgRelationShipByFabricNumber = async (req, res, next) => {
    try {
        const { fabric_number } = req.query;
        if (!fabric_number) {
            return next(new ApiError(400, "fabric_number required"));
        }
        const relationDetails = await MeterAndKgRelationShip.findOne({ fabric_number });
        if (!relationDetails) {
            return next(new ApiError(404, "Relationship not found"));
        }
        return res.status(200).json(new ApiResponse(200, "Relationship details fetched successfully.", relationDetails));
    } catch (error) {
        next(error);
    }
}

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

module.exports = { addMeterAndKgRelationship, getMeterAndKgRelationshiop, getMeterAndKgRelationShipByFabricNumber };
