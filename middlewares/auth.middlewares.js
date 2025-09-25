const jwt = require("jsonwebtoken");
const User = require("../modals/user.modal.js");
const ApiError = require("../utils/ApiError.js");

const authenticateJWT = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) {
        return next(new ApiError(401, "Unauthorized: No token provided"));
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decoded?._id).select("-password");
        if (!user) {
            return next(new ApiError(401, "User not found"));
        }

        req.user = user;
        next();
    } catch (error) {
        return next(new ApiError(401, "Token invalid or expired"));
    }
};

// ********************* Role-Based Access *****************************

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new ApiError(401, "Not authenticated"));
        }

        // case-insensitive match (optional)
        const userRole = req.user.role?.toLowerCase();
        const roles = allowedRoles.map(r => r.toLowerCase());

        if (!roles.includes(userRole)) {
            return next(new ApiError(403, "Forbidden: Insufficient role"));
        }

        next();
    };
};

module.exports = { authenticateJWT, authorizeRoles };
