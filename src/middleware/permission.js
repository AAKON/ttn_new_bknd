const { forbidden } = require('../utils/response');

const checkPermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return forbidden(res, 'Access denied');
    }

    const userPermissionNames = req.user.permissions.map((p) => p.name);
    const hasPermission = requiredPermissions.some((perm) => userPermissionNames.includes(perm));

    if (!hasPermission) {
      return forbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

module.exports = checkPermission;
