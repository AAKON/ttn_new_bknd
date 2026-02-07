const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/sourcingProposal.controller');
const commentController = require('../controllers/proposalComment.controller');
const authenticate = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const incrementViewCount = require('../middleware/visitorCounter');
const { proposalUpload } = require('../config/multer');
const handleUpload = require('../middleware/upload');

// Public (optional auth)
router.get('/filter-options/sourcing-proposals', proposalController.getFilterOptions);
router.get('/sourcing-proposals/list', optionalAuth, proposalController.publicList);
router.get('/sourcing-proposals/:id', optionalAuth, incrementViewCount('sourcing_proposals'), proposalController.show);

// My proposals (authenticated)
router.get('/my/sourcing-proposals', authenticate, proposalController.myProposals);
router.post('/my/sourcing-proposals/store', authenticate, handleUpload(proposalUpload.array('images', 10)), proposalController.store);
router.post('/my/sourcing-proposals/:id/update', authenticate, handleUpload(proposalUpload.array('images', 10)), proposalController.update);
router.delete('/my/sourcing-proposals/:id', authenticate, proposalController.destroy);
router.delete('/my/sourcing-proposals/:proposalId/images/:mediaId', authenticate, proposalController.deleteImage);

// Comments (authenticated)
router.post('/sourcing-proposals/:proposalId/comments', authenticate, commentController.addComment);
router.post('/sourcing-proposals/comments/:commentId/replies', authenticate, commentController.addReply);
router.delete('/sourcing-proposals/comments/:commentId', authenticate, commentController.deleteComment);
router.delete('/sourcing-proposals/replies/:replyId', authenticate, commentController.deleteReply);

module.exports = router;
