const { forbidden } = require('../utils/response');
const { UserRoles } = require('../config/constants');

const adminAuth = (req, res, next) => {
  if (!req.user) {
    return forbidden(res, 'Access denied');
  }

  const isAdmin = req.user.roles.some((role) => role.name === UserRoles.ADMINISTRATOR);
  if (!isAdmin) {
    return forbidden(res, 'Admin access required');
  }

  next();
};

module.exports = adminAuth;
