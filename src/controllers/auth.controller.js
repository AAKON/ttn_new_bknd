const authService = require('../services/auth.service');
const { success, error, unauthorized } = require('../utils/response');

const register = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, user_type } = req.body;
    const data = await authService.register({ first_name, last_name, email, password, user_type });
    return success(res, data, 'Registration successful!');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await authService.login({ email, password });
    return success(res, data, 'Logged in successfully!');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { email, token } = req.body;
    const data = await authService.googleLogin({ email, token });
    return success(res, data, 'Logged in successfully!');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const getUser = async (req, res, next) => {
  try {
    const data = await authService.getProfile(req.user.id);
    return success(res, data, 'User data fetched successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const data = await authService.updateProfile(req.user.id, req.body, req.file);
    return success(res, data, 'Profile updated successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(req.user.id, req.body);
    return success(res, null, 'Password changed successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body);
    return success(res, null, 'OTP sent to your email');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body);
    return success(res, null, 'Password reset successfully');
  } catch (err) {
    if (err.statusCode) return error(res, err.message, err.statusCode);
    next(err);
  }
};

const logout = async (req, res) => {
  // JWT is stateless - client just discards token
  return success(res, null, 'Logged out successfully');
};

module.exports = {
  register,
  login,
  googleLogin,
  getUser,
  updateUser,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
};
