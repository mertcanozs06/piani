const express = require('express');
const router = express.Router();
const {
  getAllPins,
  getPinDetails,
  createPinWithMemory,
  addMemoryToPin,
  deleteMemory,
  toggleLikeMemory,
  addComment,
  deleteComment,
  toggleLikeComment,
  toggleRepostMemory,
  getTopSponsoredPins,
  submitSponsorshipBid,
  getCategories
} = require('../controllers/pinController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getAllPins);
router.get('/categories', getCategories);
router.get('/sponsored', getTopSponsoredPins);
router.post('/sponsored', protect, submitSponsorshipBid);
router.get('/:id', protect, getPinDetails);
router.post('/', protect, createPinWithMemory);
router.post('/:id/memories', protect, addMemoryToPin);
router.delete('/memories/:id', protect, deleteMemory);
router.post('/memories/:id/like', protect, toggleLikeMemory);
router.post('/memories/:id/comments', protect, addComment);
router.delete('/memories/comments/:commentId', protect, deleteComment);
router.post('/memories/comments/:commentId/like', protect, toggleLikeComment);
router.post('/memories/:id/repost', protect, toggleRepostMemory);

module.exports = router;
