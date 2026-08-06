const express = require('express');
const {
  createWhitelistedUser,
  getAllWhitelistedUsers,
  getWhitelistedUserById,
  getWhitelistedUserByMobile,
  updateWhitelistedUser,
  deleteWhitelistedUser,
  toggleWhitelistedUserStatus,
  checkIfWhitelisted,
  getWhitelistedUserStats,
} = require('../controllers/whitelistedUser.controller.js');

const router = express.Router();

// Public routes
router.get('/check/:mobile_number', checkIfWhitelisted);

// Stats route (admin only)
router.get('/stats', getWhitelistedUserStats);

// CRUD routes
router.route('/').get(getAllWhitelistedUsers).post(createWhitelistedUser);

router
  .route('/:id')
  .get(getWhitelistedUserById)
  .put(updateWhitelistedUser)
  .delete(deleteWhitelistedUser);

router.get('/mobile/:mobile_number', getWhitelistedUserByMobile);
router.patch('/:id/toggle-status', toggleWhitelistedUserStatus);

module.exports = router;
