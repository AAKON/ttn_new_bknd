const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');
const blogController = require('../controllers/blog.controller');
const contactController = require('../controllers/contact.controller');
const optionalAuth = require('../middleware/optionalAuth');
const authenticate = require('../middleware/auth');

// Public endpoints (no auth)
router.get('/business-categories', publicController.getBusinessCategories);
router.get('/locations', publicController.getLocations);
router.get('/homepage', publicController.getHomepage);
router.get('/about', publicController.getAbout);
router.get('/team', publicController.getTeam);
router.get('/terms-and-conditions', publicController.getTermsAndConditions);
router.get('/pricing/list', publicController.getPricingList);
router.get('/partners', publicController.getPartners);

// Blog endpoints
router.get('/blog', blogController.getBlogs);
router.get('/blog/featured', blogController.getFeaturedBlogs);
router.get('/blog/details/:slug', blogController.getBlogDetails);
router.get('/blog/types', blogController.getBlogTypes);

// Contact/submission forms (no auth)
router.post('/contact-us/submit', contactController.submitContact);
router.post('/company-report/submit', contactController.submitCompanyReport);
router.post('/company-email/submit', contactController.submitCompanyEmail);
router.post('/newsletter/submit', contactController.submitNewsletter);

// Company claim (requires auth)
router.post('/company-claim/submit', authenticate, contactController.submitCompanyClaim);

module.exports = router;
