const express = require("express");
const {
    createUser,
    getUsers,
    updateUser,
    deleteUser,
    resetPassword,
    login,
    logout,
    getProfile
} = require("../controllers/user.controller");

const { authenticateJWT, authorizeRoles } = require("../middlewares/auth.middlewares");

const router = express.Router();

// Public routes
router.post("/register", createUser);
router.post("/login", login);
router.post("/profile", authenticateJWT, getProfile)

// Protected routes
// router.post("/logout", authenticateJWT, logout);
router.post("/logout", logout);
router.patch("/reset-password", authenticateJWT, resetPassword);

// Admin routes (example)
router.get("/", authenticateJWT, authorizeRoles("super-admin"), getUsers);
router.put("/update-user/:id", authenticateJWT, authorizeRoles("super-admin"), updateUser);
router.delete("/:id", authenticateJWT, authorizeRoles("super-admin"), deleteUser);

module.exports = router;
