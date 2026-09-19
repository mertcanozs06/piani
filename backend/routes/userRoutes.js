const express = require('express');
const router = express.Router();
const { getUserProfile, getUserProfileById, updateProfile, searchUsersAndVenues, toggleFollowUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getUserProfile);
router.get('/:id/profile', protect, getUserProfileById);
router.put('/profile', protect, updateProfile);
router.get('/search', protect, searchUsersAndVenues);
router.post('/:id/follow', protect, toggleFollowUser);

module.exports = router;
