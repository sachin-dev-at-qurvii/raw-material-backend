const ApiResponse = require("../utils/ApiResponse.js");
const ApiError = require("../utils/ApiError.js");
const FabricRate = require("../modals/fabricrate.model.js");

// const upsertFabricRateDetails = async (req, res, next) => {
//     try {
//         const payload = req.body;
//         if (!Array.isArray(payload) || payload.length === 0) {
//             return next(new ApiError(400, "Payload must be a non-empty array"));
//         }

//         let insertedCount = 0;
//         let updatedCount = 0;
//         const results = [];

//         function parseDate(ddmmyyyy) {
//             if (!ddmmyyyy) return
//             const [day, month, year] = ddmmyyyy.split("/");
//             return new Date(`${year}-${month}-${day}`);
//         }

//         for (const item of payload) {
//             const { fabric_number, recieved_date, ...rest } = item;
//             if (!fabric_number || !recieved_date) continue;

//             const dateObj = parseDate(recieved_date);

//             // Check if document exists for this fabric_number
//             const existingDoc = await FabricRate.findOne({ fabric_number });

//             if (!existingDoc) {
//                 // New fabric -> create document
//                 const created = await FabricRate.create({
//                     fabric_number,
//                     recieved_date: dateObj,
//                     ...rest,
//                     purchase_history: []
//                 });
//                 insertedCount++;
//                 results.push(created);
//             } else {
//                 // Check exact date match
//                 if (existingDoc.recieved_date.getTime() === dateObj.getTime()) {
//                     // Exact date match -> update main document
//                     const updated = await FabricRate.findOneAndUpdate(
//                         { fabric_number, recieved_date: dateObj },
//                         { $set: rest },
//                         { new: true }
//                     );
//                     updatedCount++;
//                     results.push(updated);
//                 } else {
//                     // Different date -> push current main document into purchase_history
//                     const historyEntry = {
//                         fabric_number: existingDoc.fabric_number,
//                         fabric_name: existingDoc.fabric_name,
//                         vender: existingDoc.vender,
//                         fabric_rate: existingDoc.fabric_rate,
//                         unit: existingDoc.unit,
//                         fabric_length: existingDoc.fabric_length,
//                         recieved_qty_meter: existingDoc.recieved_qty_meter,
//                         recieved_qty_kg: existingDoc.recieved_qty_kg,
//                         width: existingDoc.width,
//                         recieved_date: existingDoc.recieved_date,
//                         // include previous purchase_history too
//                         previous_history: existingDoc.purchase_history || []
//                     };

//                     // Update main document with latest date and data, push old snapshot to purchase_history
//                     const updated = await FabricRate.findOneAndUpdate(
//                         { fabric_number },
//                         {
//                             $set: {
//                                 recieved_date: dateObj,
//                                 ...rest
//                             },
//                             $push: { purchase_history: historyEntry }
//                         },
//                         { new: true }
//                     );

//                     updatedCount++;
//                     results.push(updated);
//                 }
//             }
//         }

//         return res.status(200).json(new ApiResponse(200, "Stocks processed successfully", {
//             total: results.length,
//             inserted: insertedCount,
//             updated: updatedCount,
//             data: results
//         }));

//     } catch (error) {
//         next(error);
//     }
// };

const upsertFabricRateDetails = async (req, res, next) => {
    try {
        const payload = req.body;
        if (!Array.isArray(payload) || payload.length === 0) {
            return next(new ApiError(400, "Payload must be a non-empty array"));
        }

        function parseDate(ddmmyyyy) {
            if (!ddmmyyyy) return null;
            const [day, month, year] = ddmmyyyy.split("/");
            return new Date(`${year}-${month}-${day}`);
        }

        let insertedCount = 0;
        let updatedCount = 0;

        // STEP 1: Pehle saare fabric_numbers nikal lo
        const fabricNumbers = payload.map((p) => p.fabric_number);
        const existingDocs = await FabricRate.find({ fabric_number: { $in: fabricNumbers } });
        const existingMap = new Map(existingDocs.map(doc => [doc.fabric_number, doc]));

        // STEP 2: bulk operations build karo
        const bulkOps = [];

        for (const item of payload) {
            const { fabric_number, recieved_date, ...rest } = item;
            if (!fabric_number || !recieved_date) continue;

            const dateObj = parseDate(recieved_date);
            const existingDoc = existingMap.get(fabric_number);

            if (!existingDoc) {
                // Naya fabric
                bulkOps.push({
                    insertOne: {
                        document: {
                            fabric_number,
                            recieved_date: dateObj,
                            ...rest,
                            purchase_history: []
                        }
                    }
                });
                insertedCount++;
            } else {
                if (existingDoc.recieved_date.getTime() === dateObj.getTime()) {
                    // Same date → update
                    bulkOps.push({
                        updateOne: {
                            filter: { fabric_number, recieved_date: existingDoc.recieved_date },
                            update: { $set: rest }
                        }
                    });
                    updatedCount++;
                } else {
                    // Alag date → history push
                    const historyEntry = {
                        fabric_number: existingDoc.fabric_number,
                        fabric_name: existingDoc.fabric_name,
                        vender: existingDoc.vender,
                        fabric_rate: existingDoc.fabric_rate,
                        unit: existingDoc.unit,
                        fabric_length: existingDoc.fabric_length,
                        recieved_qty_meter: existingDoc.recieved_qty_meter,
                        recieved_qty_kg: existingDoc.recieved_qty_kg,
                        width: existingDoc.width,
                        recieved_date: existingDoc.recieved_date,
                        previous_history: existingDoc.purchase_history || []
                    };

                    bulkOps.push({
                        updateOne: {
                            filter: { fabric_number },
                            update: {
                                $set: { recieved_date: dateObj, ...rest },
                                $push: { purchase_history: historyEntry }
                            }
                        }
                    });
                    updatedCount++;
                }
            }
        }

        // STEP 3: Execute bulk operation ek hi baar
        let bulkResult = {};
        if (bulkOps.length > 0) {
            bulkResult = await FabricRate.bulkWrite(bulkOps, { ordered: false });
        }

        return res.status(200).json(new ApiResponse(200, "Stocks processed successfully", {
            total: bulkOps.length,
            inserted: insertedCount,
            updated: updatedCount,
            bulkResult
        }));

    } catch (error) {
        next(error);
    }
};



const getFabricRateDetails = async (req, res, next) => {
    try {
        const fabricRateDetails = await FabricRate.find();
        if (fabricRateDetails.length === 0) {
            return next(new ApiError(404, "Fabric Rate details not found"));
        }

        return res.status(200).json(new ApiResponse(200, "Fabric rate details fetched successfully.", fabricRateDetails));
    } catch (error) {
        next(error);
    }
};

module.exports = { upsertFabricRateDetails, getFabricRateDetails };
