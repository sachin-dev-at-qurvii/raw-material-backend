const FabricAvg = require("../modals/fabricAvg.model.js");
const ApiError = require("../utils/ApiError.js");
const ApiResponse = require("../utils/ApiResponse.js");


// const upsertFabriPatterns = async (req, res, next) => {
//     try {
//         const payload = req.body;
//         if (!Array.isArray(payload) || payload.length === 0) {
//             return next(new ApiError(400, "Payload must be non-empty array"));
//         }
//         let addedCount = 0;
//         let updatedCount = 0;
//         let results = [];

//         for (const item of payload) {
//             const { patternNumber, styleImage, fabrics, accessories } = item;
//             if (!patternNumber) {
//                 continue;
//             }
//             const existing = await FabricAvg.findOne({ patternNumber });
//             if (existing) {
//                 existing.styleImage = styleImage || existing.styleImage;
//                 existing.fabrics = fabrics || existing.fabrics;
//                 existing.accessories = accessories || existing.accessories;
//                 await existing.save();
//                 updatedCount++;
//                 results.push({ patternNumber, status: "updated" });
//             } else {
//                 const newPattern = await FabricAvg.create({
//                     patternNumber,
//                     styleImage,
//                     fabrics,
//                     accessories
//                 });
//                 addedCount++;
//                 results.push({ patternNumber, status: "added" });
//             }
//         }

//         return res.status(200).json(new ApiResponse(200, "Fabric avg added/updated successfully.", {
//             addedCount,
//             updatedCount,
//             results,
//         }))
//     } catch (error) {
//         next(error);
//     }
// }
const upsertFabriPatterns = async (req, res, next) => {
    try {
        const payload = req.body;
        if (!Array.isArray(payload) || payload.length === 0) {
            return next(new ApiError(400, "Payload must be non-empty array"));
        }
        let addedCount = 0;
        let updatedCount = 0;
        let results = [];

        for (const item of payload) {
            const { patternNumber, styleImage, fabrics, accessories, style_number } = item;
            if (!style_number || !patternNumber) {
                continue;
            }
            const existing = await FabricAvg.findOne({ style_number });
            if (existing) {
                existing.styleImage = styleImage || existing.styleImage;
                existing.patternNumber = patternNumber || existing.patternNumber;
                existing.fabrics = fabrics || existing.fabrics;
                existing.accessories = accessories || existing.accessories;
                await existing.save();
                updatedCount++;
                results.push({ patternNumber, status: "updated" });
            } else {
                const newPattern = await FabricAvg.create({
                    style_number,
                    patternNumber,
                    styleImage,
                    fabrics,
                    accessories
                });
                addedCount++;
                results.push({ patternNumber, status: "added" });
            }
        }

        return res.status(200).json(new ApiResponse(200, "Fabric avg added/updated successfully.", {
            addedCount,
            updatedCount,
            results,
        }))
    } catch (error) {
        next(error);
    }
}


const getFabricPatterns = async (req, res, next) => {
    try {
        const fabrics = await FabricAvg.find();
        if (fabrics.length === 0) {
            return next(new ApiError(404, "Fabric Average not found"));
        }
        return res.status(200).json(new ApiResponse(200, `${fabrics.length} ${fabrics.length > 1 ? "Fabrics" : "Fabric"} averages fetched successfully.`, fabrics));
    } catch (error) {
        next(error);
    }
}


module.exports = { getFabricPatterns, upsertFabriPatterns }
