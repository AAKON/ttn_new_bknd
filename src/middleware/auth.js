const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { jwtSecret } = require('../config/auth');
const { unauthorized } = require('../utils/response');

const getUserWithRolesPermissions = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) return null;

  // Spatie uses polymorphic model_has_roles: model_type = 'App\\Models\\User', model_id = user.id
  const roles = await prisma.$queryRawUnsafe(
    `SELECT r.* FROM roles r
     INNER JOIN model_has_roles mhr ON mhr.role_id = r.id
     WHERE mhr.model_type = 'App\\\\Models\\\\User' AND mhr.model_id = ?`,
    userId
  );

  // Get permissions for all roles
  const roleIds = roles.map((r) => r.id);
  let permissions = [];
  if (roleIds.length > 0) {
    permissions = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT p.* FROM permissions p
       INNER JOIN role_has_permissions rhp ON rhp.permission_id = p.id
       WHERE rhp.role_id IN (${roleIds.map(() => '?').join(',')})`,
      ...roleIds
    );
  }

  user.roles = roles;
  user.permissions = permissions;
  return user;
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'No token provided');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, jwtSecret);

    const user = await getUserWithRolesPermissions(BigInt(decoded.id));

    if (!user) {
      return unauthorized(res, 'User not found');
    }

    if (user.is_banned) {
      return unauthorized(res, 'Account is banned');
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return unauthorized(res, 'Invalid or expired token');
    }
    return unauthorized(res, 'Authentication failed');
  }
};

module.exports = authenticate;
module.exports.getUserWithRolesPermissions = getUserWithRolesPermissions;
