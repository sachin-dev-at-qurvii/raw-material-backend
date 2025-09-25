const Style = require("../modals/style.modal");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");


// const createStyle = async (req, res, next) => {
//   try {
//     const {
//       styleNumber,
//       patternNumber,
//       styleImage,
//       fabrics = [],       // expect array of fabrics
//       accessories = [],   // expect array of accessories
//     } = req.body;

//     if (!styleNumber) {
//       throw new ApiError(400, "styleNumber is required");
//     }

//     const updateData = {
//       patternNumber,
//       styleImage,
//       fabrics,
//       accessories,
//     };

//     const style = await Style.findOneAndUpdate(
//       { styleNumber },
//       { $set: updateData },
//       { new: true, upsert: true }
//     );

//     res.status(200).json(
//       new ApiResponse(200, "Style created/updated successfully", style)
//     );
//   } catch (error) {
//     next(error);
//   }
// };


// get styles 

const createStyle = async (req, res, next) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body]; // allow single or multiple

    let insertedCount = 0;
    let updatedCount = 0;
    const results = [];

    for (const styleData of payload) {
      const {
        styleNumber,
        patternNumber,
        styleImage,
        fabrics = [],
        accessories = [],
      } = styleData;

      if (!styleNumber) {
        throw new ApiError(400, "styleNumber is required");
      }

      const existing = await Style.findOne({ styleNumber });

      const updateData = {
        patternNumber,
        styleImage,
        fabrics,
        accessories,
      };

      const style = await Style.findOneAndUpdate(
        { styleNumber },
        { $set: updateData },
        { new: true, upsert: true }
      );

      if (existing) {
        updatedCount++;
      } else {
        insertedCount++;
      }

      results.push(style);
    }

    res.status(200).json(
      new ApiResponse(200, "Style(s) processed successfully", {
        total: results.length,
        inserted: insertedCount,
        updated: updatedCount,
        data: results,
      })
    );
  } catch (error) {
    next(error);
  }
};


// const getStyle = async (req, res, next) => {
//   try {
//     const { styleNumber, patternNumber } = req.query;

//     if (styleNumber || patternNumber) {


//       const style = await Style.aggregate([
//         {
//           $match: {
//             styleNumber: {
//               $or: [{ styleNumber: Number(styleNumber) }, { patternNumber: patternNumber }]
//             }
//           }
//         },
//         {
//           $lookup: {
//             from: "fabricavgs",
//             localField: "patternNumber",
//             foreignField: "patternNumber",
//             as: "fabricAbgDetails"
//           }
//         },
//         {
//           $unwind: {
//             path: "$fabricAbgDetails"
//           }
//         },
//         {
//           $project: {
//             styleNumber: 1,
//             styleImage: 1,
//             accessories: 1,
//             patternNumber: 1,
//             "fabricAbgDetails.patternNumber": 1,
//             "fabricAbgDetails.fabrics": 1,
//             "fabricAbgDetails.styleImage": 1,

//           }
//         }

//       ])

//       if (!style) throw new ApiError(404, "Style not found");

//       return res.status(200).json(new ApiResponse(200, `Style fetched successfully`, style));
//     } else {
//       // const styles = await Style.find();

//       const styles = await Style.aggregate(
//         [
//           {
//             $lookup: {
//               from: "fabricavgs",
//               localField: "patternNumber",
//               foreignField: "patternNumber",
//               as: "fabricAbgDetails"
//             }
//           },
//           {
//             $unwind: {
//               path: "$fabricAbgDetails"
//             }
//           },
//           {
//             $project: {
//               styleNumber: 1,
//               styleImage: 1,
//               accessories: 1,
//               patternNumber: 1,
//               "fabricAbgDetails.patternNumber": 1,
//               "fabricAbgDetails.fabrics": 1,
//               "fabricAbgDetails.styleImage": 1,

//             }
//           }
//         ]
//       )


//       if (styles.length === 0) throw new ApiError(404, "Styles not found");

//       return res.status(200).json(new ApiResponse(200, `${styles.length} styles fetched successfully`, styles));
//     }
//   } catch (error) {
//     next(error);
//   }
// };



// update style


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
            localField: "patternNumber",
            foreignField: "patternNumber",
            as: "fabricAvgDetails"
          }
        },
        {
          $unwind: {
            path: "$fabricAvgDetails",
            preserveNullAndEmptyArrays: true // taaki fabricAvg na mile to bhi style aaye
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
            localField: "patternNumber",
            foreignField: "patternNumber",
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

const updateStyle = async (req, res, next) => {
  try {
    const styleID = req.params.id;
    const updatedData = req.body;

    const updatedStyle = await Style.findByIdAndUpdate(styleID, updatedData, { new: true, runValidators: true });
    if (!updateStyle) throw new ApiError(404, "Style not found");

    res.status(200).json(new ApiResponse(200, "Style updated successfully", updatedStyle));

  } catch (error) {
    next(error);
  }
}

// delete style

const deleteStyle = async (req, res, next) => {
  try {
    const styleID = req.params.id;

    const deletedStyle = await Style.findByIdAndDelete(styleID, { new: true })

    if (!deletedStyle) throw new ApiError(404, "Style not found")

    res.status(200).json(new ApiResponse(200, `${deleteStyle.styleNumber} deleted successfully`, deletedStyle));
  } catch (error) {
    next(error)
  }
}

module.exports = { createStyle, getStyle, updateStyle, deleteStyle }