const Style = require("../modals/style.modal");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const createStyle = async (req, res, next) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];

    if (payload.length === 0) {
      throw new ApiError(400, "Payload must be non-empty array");
    }

    // Build bulk operations
    const bulkOps = payload.map((styleData) => {
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

      const updateData = {
        patternNumber,
        styleImage,
        fabrics,
        accessories,
      };

      return {
        updateOne: {
          filter: { styleNumber },
          update: { $set: updateData },
          upsert: true,
        },
      };
    });

    // Execute bulk write
    const result = await Style.bulkWrite(bulkOps);

    const insertedCount = result.upsertedCount;
    const updatedCount = result.modifiedCount;

    return res.status(200).json(
      new ApiResponse(200, "Style(s) processed successfully", {
        total: insertedCount + updatedCount,
        inserted: insertedCount,
        updated: updatedCount,
        raw: result,
      })
    );
  } catch (error) {
    next(error);
  }
};


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
