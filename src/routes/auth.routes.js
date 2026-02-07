const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const { userUpload } = require('../config/multer');
const handleUpload = require('../middleware/upload');
const {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} = require('../validators/auth.validator');

// Public auth routes
router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/google-login', authLimiter, validate(googleLoginSchema), authController.googleLogin);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

// Protected auth routes
router.get('/user', authenticate, authController.getUser);
router.post('/user', authenticate, handleUpload(userUpload.single('image')), authController.updateUser);
router.post('/change-password', authenticate, authController.changePassword);
router.get('/logout', authenticate, authController.logout);

module.exports = router;
