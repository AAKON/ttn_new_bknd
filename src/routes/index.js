const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const publicRoutes = require('./public.routes');
const companyRoutes = require('./company.routes');
const sourcingProposalRoutes = require('./sourcingProposal.routes');
const favoritesRoutes = require('./favorites.routes');
const adminRoutes = require('./admin');

router.use('/auth', authRoutes);
router.use('/', publicRoutes);
router.use('/', companyRoutes);
router.use('/', sourcingProposalRoutes);
router.use('/', favoritesRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
