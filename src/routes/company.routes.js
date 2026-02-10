const express = require('express');
const router = express.Router();
const companyController = require('../controllers/company.controller');
const myCompanyController = require('../controllers/myCompany.controller');
const authenticate = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const incrementViewCount = require('../middleware/visitorCounter');
const { companyUpload, productUpload, clientUpload } = require('../config/multer');
const handleUpload = require('../middleware/upload');

// Public company endpoints
router.post('/company/list', optionalAuth, companyController.companyList);
router.get('/company/filter-options', companyController.getFilterOptions);
router.get('/company/:slug', optionalAuth, incrementViewCount('companies'), companyController.companyDetails);

// My company endpoints (authenticated)
router.get('/my/company/list', authenticate, myCompanyController.myCompanyList);
router.post('/my/company/store', authenticate, handleUpload(companyUpload.single('image')), myCompanyController.storeCompany);
router.get('/my/company/edit/:slug', authenticate, myCompanyController.editCompany);
router.post('/my/company/update/:slug', authenticate, handleUpload(companyUpload.single('image')), myCompanyController.updateCompany);
router.post('/my/company/certificates/:slug', authenticate, myCompanyController.updateCertificates);

// Preparation data
router.get('/my/company/preparation-data/for-basic', authenticate, myCompanyController.getPreparationDataForBasic);
router.get('/my/company/preparation-data/for-overview', authenticate, myCompanyController.getPreparationDataForOverview);

// Overview
router.get('/my/company/:slug/overview', authenticate, myCompanyController.getOverview);
router.post('/my/company/:slug/overview/store-or-update', authenticate, myCompanyController.storeOrUpdateOverview);

// Products
router.get('/my/company/:slug/product', authenticate, myCompanyController.getProducts);
router.post('/my/company/:slug/product/store', authenticate, handleUpload(productUpload.single('image')), myCompanyController.storeProduct);
router.post('/my/company/:slug/product/:product_id/update', authenticate, handleUpload(productUpload.single('image')), myCompanyController.updateProduct);
router.get('/my/company/:slug/product/:product_id/delete', authenticate, myCompanyController.deleteProduct);

// FAQs
router.get('/my/company/:slug/faq', authenticate, myCompanyController.getFaqs);
router.post('/my/company/:slug/faq/store', authenticate, myCompanyController.storeFaq);
router.get('/my/company/:slug/faq/:faq_id/delete', authenticate, myCompanyController.deleteFaq);

// Clients
router.get('/my/company/:slug/client', authenticate, myCompanyController.getClients);
router.post('/my/company/:slug/client/store', authenticate, handleUpload(clientUpload.single('image')), myCompanyController.storeClient);
router.get('/my/company/:slug/client/:client_id/delete', authenticate, myCompanyController.deleteClient);

// Business Contact
router.get('/my/company/:slug/contact', authenticate, myCompanyController.getContact);
router.post('/my/company/:slug/contact/store-or-update', authenticate, myCompanyController.storeOrUpdateContact);

// Decision Makers
router.get('/my/company/:slug/decision-maker', authenticate, myCompanyController.getDecisionMakers);
router.post('/my/company/:slug/decision-makers', authenticate, myCompanyController.bulkSaveDecisionMakers);
router.post('/my/company/:slug/decision-maker/store', authenticate, myCompanyController.storeDecisionMaker);
router.post('/my/company/:slug/decision-maker/:decision_maker_id/update', authenticate, myCompanyController.updateDecisionMaker);
router.get('/my/company/:slug/decision-maker/:decision_maker_id/delete', authenticate, myCompanyController.deleteDecisionMaker);

module.exports = router;
