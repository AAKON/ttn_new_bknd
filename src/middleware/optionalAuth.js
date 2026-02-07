const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config/auth');
const { getUserWithRolesPermissions } = require('./auth');

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);
    const user = await getUserWithRolesPermissions(BigInt(decoded.id));
    req.user = user || null;
  } catch {
    req.user = null;
  }
  next();
};

module.exports = optionalAuth;
