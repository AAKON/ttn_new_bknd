const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favorites.controller');
const authenticate = require('../middleware/auth');

// Company favorites
router.get('/my/favorite', authenticate, favoritesController.getFavoriteCompanies);
router.get('/my/favorite/:slug', authenticate, favoritesController.toggleFavoriteCompany);

// Proposal favorites
router.get('/favorites/sourcing-proposals', authenticate, favoritesController.getFavoriteProposals);
router.post('/favorites/sourcing-proposals/:id/add', authenticate, favoritesController.addFavoriteProposal);
router.delete('/favorites/sourcing-proposals/:id/remove', authenticate, favoritesController.removeFavoriteProposal);
router.post('/favorites/sourcing-proposals/:id/toggle', authenticate, favoritesController.toggleFavoriteProposal);

module.exports = router;
