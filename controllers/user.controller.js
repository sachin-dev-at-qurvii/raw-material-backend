const User = require("../modals/user.modal");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const validator = require("validator");
const jwt = require("jsonwebtoken");

// Generate access token
const generateAccessToken = async (id) => {
  try {
    const user = await User.findById(id);
    if (!user) throw new ApiError(404, "User not found");

    const token = await user.generateAccessToken();
    return token;
  } catch (error) {
    throw new ApiError(400, "Invalid user!");
  }
};

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // dev me false rakho
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/", // important for clearing cookie
};

// -------------------- Create User --------------------
const createUser = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      throw new ApiError(400, "All fields are required");
    }

    if (!validator.isEmail(email)) {
      throw new ApiError(400, "Invalid email format");
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new ApiError(409, `${email} already exists. Please login or try another email`);
    }

    const createdUser = await User.create({ username, email, password, role: role || "user" });

    const token = await generateAccessToken(createdUser._id);
    createdUser.accessToken = token;
    await createdUser.save({ validateBeforeSave: false });

    res
      .status(201)
      .cookie("token", token, cookieOptions)
      .json(new ApiResponse(201, "User created successfully", {
        userID: createdUser._id,
        username: createdUser.username,
        email: createdUser.email,
        role: createdUser.role,
        token,
      }));
  } catch (error) {
    next(error);
  }
};

// -------------------- Login --------------------
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, "All fields are required");
    }

    const user = await User.findOne({ email }).select("-avatarMale -avatarFemale");
    if (!user) throw new ApiError(404, "Invalid credentials");

    const isPasswordMatch = await user.isPasswordCorrect(password);
    if (!isPasswordMatch) throw new ApiError(401, "Invalid credentials");

    const token = await generateAccessToken(user._id);

    const userResponse = user.toObject();
    userResponse.token = token;
    delete userResponse.password;

    res
      .status(200)
      .cookie("token", token, cookieOptions)
      .json(new ApiResponse(200, "Login successful", userResponse));
  } catch (error) {
    next(error);
  }
};

// -------------------- Logout --------------------
const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, "User not found");

    user.accessToken = undefined;
    await user.save();

    res
      .status(200)
      .clearCookie("token", cookieOptions) // must match cookieOptions
      .json(new ApiResponse(200, "User logout successful. Please login again."));
  } catch (error) {
    next(error);
  }
};

// -------------------- Reset Password --------------------
const resetPassword = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    const { password } = req.body;

    if (!token) throw new ApiError(401, "No token provided");
    if (!password || password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters long");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      throw new ApiError(401, "Invalid or expired token");
    }

    const user = await User.findById(decoded._id);
    if (!user) throw new ApiError(404, "User not found");

    user.password = password; // hash via pre-save hook
    await user.save();

    res.status(200).json(new ApiResponse(200, "Password reset successfully"));
  } catch (error) {
    next(error);
  }
};

//------------------------- UPDATE USER -------------------------
const updateUser = async (req, res, next) => {
  try {
    const userID = req.params.id;
    const user_updated_data = req.body;
    const updated_user = await User.findByIdAndUpdate(userID, user_updated_data, { runValidators: true, new: true }).select("-password -accessToken");
    if (!updated_user) { throw new ApiError(404, "User not found"); } res.status(200).json(new ApiResponse(200, "User updated successfully", updated_user));
  }
  catch (error) { next(error); }
}

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find();
    res.status(200).json(new ApiResponse(200, "All users fetched successfully.", users));
  }
  catch (error) {
    next(error)
  }
}

const getProfile = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return next(new ApiError(404, "User not found"));
    }

    return res.status(200).json(new ApiResponse(200, "User fetched successfully", user));
  } catch (error) {
    next(error);
  }
}


const deleteUser = async (req, res, next) => {
  try {
    const userID = req.params.id;
    const user = await User.findByIdAndDelete(userID).select("-password");
    if (!user) { throw new ApiError(404, "User not found"); } res.status(200).json(new ApiResponse(200, "User deleted successfully.", user));
  } catch (error) {
    next(error);

  }
};


module.exports = { createUser, getUsers, updateUser, deleteUser, resetPassword, login, logout, getProfile };
