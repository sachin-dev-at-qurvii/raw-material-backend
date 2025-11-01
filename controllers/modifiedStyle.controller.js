const Style = require("../modals/style.modal");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

// BULK CREATE OR UPDATE STYLES
const bulkCreateOrUpdateStyles = async (req, res, next) => {
    try {
        const { styles } = req.body;

        // ✅ Validate payload
        if (!Array.isArray(styles) || styles.length === 0) {
            return next(new ApiError(400, "Styles array is required and must not be empty."));
        }

        // ✅ Prepare bulk operations
        const bulkOps = styles.map((style) => ({
            updateOne: {
                filter: { styleNumber: style.styleNumber },
                update: {
                    $set: {
                        patternNumber: style.patternNumber,
                        styleImage: style.styleImage,
                        fabrics: style.fabrics || [],
                        accessories: style.accessories || [],
                    },
                },
                upsert: true, // Create if not exists
            },
        }));

        // ✅ Execute bulkWrite
        const result = await Style.bulkWrite(bulkOps, { ordered: false });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    {
                        matchedCount: result.matchedCount,
                        modifiedCount: result.modifiedCount,
                        upsertedCount: result.upsertedCount,
                    },
                    "Styles processed successfully (created/updated)."
                )
            );

    } catch (error) {
        console.error("Error in bulkCreateOrUpdateStyles:", error);
        return next(new ApiError(500, "Failed to process styles."));
    }
};

// GET ALL STYLES (OPTIONAL HELPER)
const getAllStyles = async (req, res, next) => {
    try {
        const styles = await Style.find({});
        return res.status(200).json(new ApiResponse(200, styles, "All styles fetched successfully."));
    } catch (error) {
        console.error(error);
        return next(new ApiError(500, "Failed to fetch styles."));
    }
};

// const getStyle = async (req, res, next) => {
//     try {
//         const { styleNumber, patternNumber } = req.query;

//         if (styleNumber || patternNumber) {
//             const style = await Style.aggregate([
//                 {
//                     $match: {
//                         $or: [
//                             { styleNumber: Number(styleNumber) },
//                             { patternNumber: patternNumber }
//                         ]
//                     }
//                 },
//                 {
//                     $lookup: {
//                         from: "fabricavgs",
//                         localField: "patternNumber",
//                         foreignField: "patternNumber",
//                         as: "fabricAvgDetails"
//                     }
//                 },
//                 {
//                     $unwind: {
//                         path: "$fabricAvgDetails",
//                         preserveNullAndEmptyArrays: true
//                     }
//                 },
//                 {
//                     $project: {
//                         styleNumber: 1,
//                         styleImage: 1,
//                         accessories: 1,
//                         patternNumber: 1,
//                         fabrics: 1,
//                         "fabricAvgDetails.patternNumber": 1,
//                         "fabricAvgDetails.fabrics": 1,
//                         "fabricAvgDetails.styleImage": 1,
//                     }
//                 }
//             ]);

//             if (!style || style.length === 0) throw new ApiError(404, "Style not found");

//             return res.status(200).json(new ApiResponse(200, `Style fetched successfully`, style));
//         } else {
//             const styles = await Style.aggregate([
//                 {
//                     $lookup: {
//                         from: "fabricavgs",
//                         localField: "patternNumber",
//                         foreignField: "patternNumber",
//                         as: "fabricAvgDetails"
//                     }
//                 },
//                 {
//                     $unwind: {
//                         path: "$fabricAbgDetails",
//                         preserveNullAndEmptyArrays: true
//                     }
//                 },
//                 {
//                     $project: {
//                         styleNumber: 1,
//                         styleImage: 1,
//                         accessories: 1,
//                         patternNumber: 1,
//                         fabrics: 1,
//                         "fabricAvgDetails.patternNumber": 1,
//                         "fabricAvgDetails.fabrics": 1,
//                         "fabricAvgDetails.styleImage": 1,
//                     }
//                 }
//             ]);

//             if (styles.length === 0) throw new ApiError(404, "Styles not found");

//             return res.status(200).json(new ApiResponse(200, `${styles.length} styles fetched successfully`, styles));
//         }
//     } catch (error) {
//         next(error);
//     }
// };


const getStyle = async (req, res, next) => {
    try {
        const { styleNumber, patternNumber } = req.query;

        if (styleNumber || patternNumber) {
            const style = await Style.aggregate([
                {
                    $match: {
                        $or: [
                            { styleNumber: Number(styleNumber) },
                            { patternNumber: patternNumber }
                        ]
                    }
                },
                {

                    $lookup: {
                        from: "fabricavgs",
                        localField: "styleNumber",
                        foreignField: "style_number",
                        as: "fabricAvgDetails"
                    }
                },
                {
                    $unwind: {
                        path: "$fabricAvgDetails",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        styleNumber: 1,
                        styleImage: 1,
                        accessories: 1,
                        patternNumber: 1,
                        fabrics: 1,
                        "fabricAvgDetails.patternNumber": 1,
                        "fabricAvgDetails.fabrics": 1,
                        "fabricAvgDetails.styleImage": 1,
                    }
                }
            ]);

            if (!style || style.length === 0) throw new ApiError(404, "Style not found");

            return res.status(200).json(new ApiResponse(200, `Style fetched successfully`, style));
        } else {
            const styles = await Style.aggregate([
                {

                    $lookup: {
                        from: "fabricavgs",
                        localField: "styleNumber",
                        foreignField: "style_number",
                        as: "fabricAvgDetails"
                    }
                },
                {
                    $unwind: {
                        path: "$fabricAbgDetails",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        styleNumber: 1,
                        styleImage: 1,
                        accessories: 1,
                        patternNumber: 1,
                        fabrics: 1,
                        "fabricAvgDetails.patternNumber": 1,
                        "fabricAvgDetails.fabrics": 1,
                        "fabricAvgDetails.styleImage": 1,
                    }
                }
            ]);

            if (styles.length === 0) throw new ApiError(404, "Styles not found");

            return res.status(200).json(new ApiResponse(200, `${styles.length} styles fetched successfully`, styles));
        }
    } catch (error) {
        next(error);
    }
};



module.exports = { bulkCreateOrUpdateStyles, getStyle }