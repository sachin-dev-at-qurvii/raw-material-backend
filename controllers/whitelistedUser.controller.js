const { WhitelistedUser } = require('../modals/whitelistedUser.model.js');
const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError.js');

// ─────────────────────────────────────────────────────────────
// 1. CREATE - Add a new whitelisted user
// ─────────────────────────────────────────────────────────────
const createWhitelistedUser = async (req, res, next) => {
  try {
    const { mobile_number, username, role = 'staff', isActive = true } = req.body;

    // Validation
    if (!mobile_number || !username) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number and username are required',
      });
    }

    // Check if mobile number already exists
    const existingUser = await WhitelistedUser.findOne({ mobile_number });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `User with mobile number ${mobile_number} already exists`,
      });
    }

    // Create new user
    const newUser = await WhitelistedUser.create({
      mobile_number,
      username,
      role,
      isActive,
    });

    return res.status(201).json({
      success: true,
      message: 'Whitelisted user created successfully',
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// 2. READ - Get all whitelisted users with pagination
// ─────────────────────────────────────────────────────────────
const getAllWhitelistedUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
    const role = req.query.role || '';

    // Build filter
    const filter = {};

    if (search) {
      filter.$or = [
        { mobile_number: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
      ];
    }

    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    if (role) {
      filter.role = role;
    }

    const [users, totalCount] = await Promise.all([
      WhitelistedUser.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      WhitelistedUser.countDocuments(filter),
    ]);

    if (users.length === 0) {
      return res.status(404).json(new ApiError(404, 'Users not found'));
    }

    return res.status(200).json({
      success: true,
      message: 'Whitelisted users fetched successfully',
      data: {
        users,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// 3. READ - Get single whitelisted user by ID
// ─────────────────────────────────────────────────────────────
const getWhitelistedUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const user = await WhitelistedUser.findById(id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Whitelisted user not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Whitelisted user fetched successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// 4. READ - Get whitelisted user by mobile number
// ─────────────────────────────────────────────────────────────
const getWhitelistedUserByMobile = async (req, res, next) => {
  try {
    const { mobile_number } = req.params;

    if (!mobile_number) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required',
      });
    }

    const user = await WhitelistedUser.findOne({ mobile_number }).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Whitelisted user not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Whitelisted user fetched successfully',
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// 5. UPDATE - Update whitelisted user by ID
// ─────────────────────────────────────────────────────────────
const updateWhitelistedUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { mobile_number, username, role, isActive } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    // Check if user exists
    const existingUser = await WhitelistedUser.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Whitelisted user not found',
      });
    }

    // Check for duplicate mobile number if changing
    if (mobile_number && mobile_number !== existingUser.mobile_number) {
      const duplicate = await WhitelistedUser.findOne({
        mobile_number,
        _id: { $ne: id },
      });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `User with mobile number ${mobile_number} already exists`,
        });
      }
    }

    // Update user
    const updatedUser = await WhitelistedUser.findByIdAndUpdate(
      id,
      {
        ...(mobile_number && { mobile_number }),
        ...(username && { username }),
        ...(role && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Whitelisted user updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// 6. DELETE - Delete whitelisted user by ID
// ─────────────────────────────────────────────────────────────
const deleteWhitelistedUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const deletedUser = await WhitelistedUser.findByIdAndDelete(id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'Whitelisted user not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Whitelisted user deleted successfully',
      data: deletedUser,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// 7. TOGGLE STATUS - Activate/Deactivate user
// ─────────────────────────────────────────────────────────────
const toggleWhitelistedUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format',
      });
    }

    const user = await WhitelistedUser.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Whitelisted user not found',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// 8. CHECK - Check if mobile number is whitelisted
// ─────────────────────────────────────────────────────────────
const checkIfWhitelisted = async (req, res, next) => {
  try {
    const { mobile_number } = req.params;

    if (!mobile_number) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required',
      });
    }

    const user = await WhitelistedUser.findOne({
      mobile_number,
      isActive: true,
    });

    return res.status(200).json({
      success: true,
      message: 'User whitelist status checked',
      data: {
        isWhitelisted: !!user,
        user: user || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────────
// 9. STATS - Get statistics
// ─────────────────────────────────────────────────────────────
const getWhitelistedUserStats = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, inactiveUsers, roles] = await Promise.all([
      WhitelistedUser.countDocuments(),
      WhitelistedUser.countDocuments({ isActive: true }),
      WhitelistedUser.countDocuments({ isActive: false }),
      WhitelistedUser.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Whitelisted user statistics fetched successfully',
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        roles,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createWhitelistedUser,
  getAllWhitelistedUsers,
  getWhitelistedUserById,
  getWhitelistedUserByMobile,
  updateWhitelistedUser,
  deleteWhitelistedUser,
  toggleWhitelistedUserStatus,
  checkIfWhitelisted,
  getWhitelistedUserStats,
};
