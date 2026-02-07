const prisma = require('../../config/database');
const { success, error, notFound } = require('../../utils/response');
const { getPaginationParams } = require('../../utils/pagination');

const index = async (req, res, next) => {
  try {
    const roles = await prisma.roles.findMany({
      orderBy: { created_at: 'desc' },
      include: { role_has_permissions: { include: { permissions: true } } },
    });

    const result = roles.map((r) => ({
      id: Number(r.id),
      name: r.name,
      guard_name: r.guard_name,
      permissions: r.role_has_permissions.map((rhp) => ({
        id: Number(rhp.permissions.id),
        name: rhp.permissions.name,
      })),
      created_at: r.created_at,
    }));

    return success(res, result, 'Roles fetched');
  } catch (err) {
    next(err);
  }
};

const show = async (req, res, next) => {
  try {
    const role = await prisma.roles.findUnique({
      where: { id: BigInt(req.params.id) },
      include: { role_has_permissions: { include: { permissions: true } } },
    });
    if (!role) return notFound(res, 'Role not found');

    return success(res, {
      id: Number(role.id),
      name: role.name,
      guard_name: role.guard_name,
      permissions: role.role_has_permissions.map((rhp) => ({
        id: Number(rhp.permissions.id),
        name: rhp.permissions.name,
      })),
    }, 'Role fetched');
  } catch (err) {
    next(err);
  }
};

const store = async (req, res, next) => {
  try {
    const { name, permissions } = req.body;

    const role = await prisma.roles.create({
      data: {
        name,
        guard_name: 'web',
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Assign permissions
    if (permissions && Array.isArray(permissions)) {
      const permData = permissions.map((permId) => ({
        role_id: role.id,
        permission_id: BigInt(permId),
      }));
      for (const pd of permData) {
        await prisma.role_has_permissions.create({ data: pd });
      }
    }

    return success(res, { id: Number(role.id) }, 'Role created successfully');
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { name, permissions } = req.body;
    const roleId = BigInt(req.params.id);

    await prisma.roles.update({
      where: { id: roleId },
      data: { name, updated_at: new Date() },
    });

    // Sync permissions
    if (permissions && Array.isArray(permissions)) {
      await prisma.role_has_permissions.deleteMany({ where: { role_id: roleId } });
      const permData = permissions.map((permId) => ({
        role_id: roleId,
        permission_id: BigInt(permId),
      }));
      for (const pd of permData) {
        await prisma.role_has_permissions.create({ data: pd });
      }
    }

    return success(res, null, 'Role updated successfully');
  } catch (err) {
    next(err);
  }
};

const destroy = async (req, res, next) => {
  try {
    await prisma.role_has_permissions.deleteMany({ where: { role_id: BigInt(req.params.id) } });
    await prisma.roles.delete({ where: { id: BigInt(req.params.id) } });
    return success(res, null, 'Role deleted successfully');
  } catch (err) {
    next(err);
  }
};

const getPermissions = async (req, res, next) => {
  try {
    const permissions = await prisma.permissions.findMany({ orderBy: { name: 'asc' } });
    return success(res, permissions.map((p) => ({ id: Number(p.id), name: p.name })), 'Permissions fetched');
  } catch (err) {
    next(err);
  }
};

module.exports = { index, show, store, update, destroy, getPermissions };
