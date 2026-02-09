const express = require('express');
const router = express.Router();
const authenticate = require('../../middleware/auth');
const adminAuth = require('../../middleware/adminAuth');
const checkPermission = require('../../middleware/permission');
const { Permissions } = require('../../config/constants');
const { categoryUpload, certificateUpload, blogUpload, partnerUpload, teamUpload, aboutUpload, adUpload, companyUpload } = require('../../config/multer');
const handleUpload = require('../../middleware/upload');

const dashboardController = require('../../controllers/admin/dashboard.controller');
const rolesController = require('../../controllers/admin/roles.controller');
const usersController = require('../../controllers/admin/users.controller');
const resourcesController = require('../../controllers/admin/resources.controller');

// All admin routes require authentication + admin role
router.use(authenticate, adminAuth);

// Dashboard
router.get('/dashboard', checkPermission(Permissions.ACCESS_DASHBOARD), dashboardController.getDashboard);

// Role management
router.get('/role-management', checkPermission(Permissions.ACCESS_MANAGEMENT_VIEW), rolesController.index);
router.get('/role-management/permissions', checkPermission(Permissions.ACCESS_MANAGEMENT_VIEW), rolesController.getPermissions);
router.get('/role-management/:id', checkPermission(Permissions.ACCESS_MANAGEMENT_VIEW), rolesController.show);
router.post('/role-management', checkPermission(Permissions.ACCESS_MANAGEMENT_EDIT), rolesController.store);
router.put('/role-management/:id', checkPermission(Permissions.ACCESS_MANAGEMENT_EDIT), rolesController.update);
router.delete('/role-management/:id', checkPermission(Permissions.ACCESS_MANAGEMENT_EDIT), rolesController.destroy);

// Admin management
router.get('/admin-management', checkPermission(Permissions.ACCESS_MANAGEMENT_VIEW), usersController.getAdmins);
router.post('/admin-management', checkPermission(Permissions.ACCESS_MANAGEMENT_EDIT), usersController.storeAdmin);
router.put('/admin-management/:id', checkPermission(Permissions.ACCESS_MANAGEMENT_EDIT), usersController.updateAdmin);
router.delete('/admin-management/:id', checkPermission(Permissions.ACCESS_MANAGEMENT_EDIT), usersController.deleteAdmin);

// User management
router.get('/user-management', checkPermission(Permissions.USER_MANAGEMENT), usersController.getUsers);
router.delete('/user-management/:id', checkPermission(Permissions.USER_MANAGEMENT), usersController.deleteUser);
router.put('/user-management/:id/password', checkPermission(Permissions.USER_MANAGEMENT), usersController.updateUserPassword);
router.post('/user-management/:id/toggle-ban', checkPermission(Permissions.USER_MANAGEMENT), usersController.toggleBan);

// Business categories
router.get('/business-categories', checkPermission(Permissions.COMPANY_VIEW), resourcesController.getBusinessCategories);
router.post('/business-categories', checkPermission(Permissions.COMPANY_EDIT), handleUpload(categoryUpload.single('image')), resourcesController.storeBusinessCategory);
router.put('/business-categories/:id', checkPermission(Permissions.COMPANY_EDIT), handleUpload(categoryUpload.single('image')), resourcesController.updateBusinessCategory);
router.delete('/business-categories/:id', checkPermission(Permissions.COMPANY_EDIT), resourcesController.deleteBusinessCategory);

// Business types
router.get('/business-types', checkPermission(Permissions.COMPANY_VIEW), resourcesController.getBusinessTypes);
router.post('/business-types', checkPermission(Permissions.COMPANY_EDIT), resourcesController.storeBusinessType);
router.put('/business-types/:id', checkPermission(Permissions.COMPANY_EDIT), resourcesController.updateBusinessType);
router.delete('/business-types/:id', checkPermission(Permissions.COMPANY_EDIT), resourcesController.deleteBusinessType);

// Certificates
router.get('/certificates', checkPermission(Permissions.COMPANY_VIEW), resourcesController.getCertificates);
router.post('/certificates', checkPermission(Permissions.COMPANY_EDIT), handleUpload(certificateUpload.single('image')), resourcesController.storeCertificate);
router.put('/certificates/:id', checkPermission(Permissions.COMPANY_EDIT), handleUpload(certificateUpload.single('image')), resourcesController.updateCertificate);
router.delete('/certificates/:id', checkPermission(Permissions.COMPANY_EDIT), resourcesController.deleteCertificate);

// Product categories
router.get('/product-categories', checkPermission(Permissions.COMPANY_VIEW), resourcesController.getProductCategories);
router.post('/product-categories', checkPermission(Permissions.COMPANY_EDIT), resourcesController.storeProductCategory);
router.put('/product-categories/:id', checkPermission(Permissions.COMPANY_EDIT), resourcesController.updateProductCategory);
router.delete('/product-categories/:id', checkPermission(Permissions.COMPANY_EDIT), resourcesController.deleteProductCategory);

// Blogs
router.get('/blogs', checkPermission(Permissions.BLOG_VIEW), resourcesController.getBlogs);
router.get('/blogs/:id', checkPermission(Permissions.BLOG_VIEW), resourcesController.showBlog);
router.post('/blogs', checkPermission(Permissions.BLOG_EDIT), handleUpload(blogUpload.single('featured_image')), resourcesController.storeBlog);
router.put('/blogs/:id', checkPermission(Permissions.BLOG_EDIT), handleUpload(blogUpload.single('featured_image')), resourcesController.updateBlog);
router.delete('/blogs/:id', checkPermission(Permissions.BLOG_EDIT), resourcesController.deleteBlog);
router.post('/blogs/:id/toggle-status', checkPermission(Permissions.BLOG_EDIT), resourcesController.toggleBlogStatus);

// Blog types
router.get('/blog-types', checkPermission(Permissions.BLOG_VIEW), resourcesController.getBlogTypes);
router.post('/blog-types', checkPermission(Permissions.BLOG_EDIT), resourcesController.storeBlogType);
router.put('/blog-types/:id', checkPermission(Permissions.BLOG_EDIT), resourcesController.updateBlogType);
router.delete('/blog-types/:id', checkPermission(Permissions.BLOG_EDIT), resourcesController.deleteBlogType);

// Pricing
router.get('/pricing', checkPermission(Permissions.PRICING_VIEW), resourcesController.getPricings);
router.post('/pricing', checkPermission(Permissions.PRICING_EDIT), resourcesController.storePricing);
router.put('/pricing/:id', checkPermission(Permissions.PRICING_EDIT), resourcesController.updatePricing);
router.delete('/pricing/:id', checkPermission(Permissions.PRICING_EDIT), resourcesController.deletePricing);

// Partners
router.get('/partners', checkPermission(Permissions.MORE_VIEW), resourcesController.getPartners);
router.post('/partners', checkPermission(Permissions.MORE_EDIT), handleUpload(partnerUpload.single('image')), resourcesController.storePartner);
router.put('/partners/:id', checkPermission(Permissions.MORE_EDIT), handleUpload(partnerUpload.single('image')), resourcesController.updatePartner);
router.delete('/partners/:id', checkPermission(Permissions.MORE_EDIT), resourcesController.deletePartner);

// Team
router.get('/team', checkPermission(Permissions.MORE_VIEW), resourcesController.getTeam);
router.post('/team', checkPermission(Permissions.MORE_EDIT), handleUpload(teamUpload.single('image')), resourcesController.storeTeamMember);
router.put('/team/:id', checkPermission(Permissions.MORE_EDIT), handleUpload(teamUpload.single('image')), resourcesController.updateTeamMember);
router.delete('/team/:id', checkPermission(Permissions.MORE_EDIT), resourcesController.deleteTeamMember);

// About
router.get('/about', checkPermission(Permissions.MORE_VIEW), resourcesController.getAbout);
router.post('/about', checkPermission(Permissions.MORE_EDIT), handleUpload(aboutUpload.single('image')), resourcesController.updateAbout);

// Business ads
router.get('/business-ads', checkPermission(Permissions.MORE_VIEW), resourcesController.getBusinessAds);
router.post('/business-ads', checkPermission(Permissions.MORE_EDIT), handleUpload(adUpload.single('image')), resourcesController.storeBusinessAd);
router.put('/business-ads/:id', checkPermission(Permissions.MORE_EDIT), handleUpload(adUpload.single('image')), resourcesController.updateBusinessAd);
router.delete('/business-ads/:id', checkPermission(Permissions.MORE_EDIT), resourcesController.deleteBusinessAd);

// Contact messages
router.get('/contact-messages', checkPermission(Permissions.MORE_VIEW), resourcesController.getContactMessages);
router.put('/contact-messages/:id', checkPermission(Permissions.MORE_EDIT), resourcesController.updateContactMessage);
router.delete('/contact-messages/:id', checkPermission(Permissions.MORE_EDIT), resourcesController.deleteContactMessage);

// Company reports
router.get('/company-reports', checkPermission(Permissions.MORE_VIEW), resourcesController.getCompanyReports);
router.delete('/company-reports/:id', checkPermission(Permissions.MORE_EDIT), resourcesController.deleteCompanyReport);

// Company emails
router.get('/company-emails', checkPermission(Permissions.MORE_VIEW), resourcesController.getCompanyEmails);
router.put('/company-emails/:id', checkPermission(Permissions.MORE_EDIT), resourcesController.updateCompanyEmail);
router.delete('/company-emails/:id', checkPermission(Permissions.MORE_EDIT), resourcesController.deleteCompanyEmail);

// Company claims
router.get('/company-claims', checkPermission(Permissions.MORE_VIEW), resourcesController.getCompanyClaims);
router.post('/company-claims/:id/status', checkPermission(Permissions.MORE_EDIT), resourcesController.updateClaimStatus);

// Newsletter
router.get('/newsletter', checkPermission(Permissions.MORE_VIEW), resourcesController.getNewsletters);
router.delete('/newsletter/:id', checkPermission(Permissions.MORE_EDIT), resourcesController.deleteNewsletter);

// Site settings
router.get('/site-settings', checkPermission(Permissions.MORE_VIEW), resourcesController.getSiteSettings);
router.post('/site-settings', checkPermission(Permissions.MORE_EDIT), resourcesController.updateSiteSettings);

// Sourcing proposals (admin)
router.get('/sourcing-proposals', checkPermission(Permissions.MORE_VIEW), resourcesController.getAdminProposals);
router.post('/sourcing-proposals/:id/approve', checkPermission(Permissions.MORE_EDIT), resourcesController.approveProposal);
router.post('/sourcing-proposals/:id/reject', checkPermission(Permissions.MORE_EDIT), resourcesController.rejectProposal);
router.delete('/sourcing-proposals/:id', checkPermission(Permissions.MORE_EDIT), resourcesController.deleteAdminProposal);

module.exports = router;
