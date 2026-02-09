const prisma = require('../../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { success, error, notFound } = require('../../utils/response');
const { getPaginationParams } = require('../../utils/pagination');
const { bcryptRounds } = require('../../config/auth');
const { getMediaForModel } = require('../../services/media.service');
const { assignRole } = require('../../services/auth.service');

// Admin management
const getAdmins = async (req, res, next) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);

    // Get admin user IDs
    const adminRoleUsers = await prisma.$queryRawUnsafe(
      `SELECT mhr.model_id FROM model_has_roles mhr
       INNER JOIN roles r ON r.id = mhr.role_id
       WHERE r.name = 'administrator' AND mhr.model_type = 'App\\\\Models\\\\User'`
    );
    const adminIds = adminRoleUsers.map((u) => u.model_id);

    if (adminIds.length === 0) return success(res, { data: [], pagination: { current_page: page, last_page: 1, total: 0, per_page: perPage } });

    const where = { id: { in: adminIds }, deleted_at: null };
    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.users.count({ where }),
    ]);

    const result = await Promise.all(users.map(async (u) => {
      const media = await getMediaForModel('App\\Models\\User', u.id, 'profile_picture');
      return {
        id: Number(u.id),
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        phone: u.phone,
        status: u.status,
        is_banned: u.is_banned,
        profile_picture: media.length > 0 ? media[0].url : null,
        created_at: u.created_at,
      };
    }));

    return success(res, {
      data: result,
      pagination: { current_page: page, last_page: Math.ceil(total / perPage), total, per_page: perPage },
    }, 'Admins fetched');
  } catch (err) {
    next(err);
  }
};

const storeAdmin = async (req, res, next) => {
  try {
    const { first_name, last_name, email, password, phone } = req.body;

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) return error(res, 'Email already exists', 422);

    const user = await prisma.users.create({
      data: {
        uuid: uuidv4(),
        first_name,
        last_name,
        email,
        password: await bcrypt.hash(password, bcryptRounds),
        phone: phone || null,
        status: 'approved',
        email_verified_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    await assignRole(user.id, 'administrator');
    return success(res, { id: Number(user.id) }, 'Admin created successfully');
  } catch (err) {
    next(err);
  }
};

const updateAdmin = async (req, res, next) => {
  try {
    const updateData = { updated_at: new Date() };
    if (req.body.first_name) updateData.first_name = req.body.first_name;
    if (req.body.last_name) updateData.last_name = req.body.last_name;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.password) updateData.password = await bcrypt.hash(req.body.password, bcryptRounds);

    await prisma.users.update({ where: { id: BigInt(req.params.id) }, data: updateData });
    return success(res, null, 'Admin updated successfully');
  } catch (err) {
    next(err);
  }
};

const deleteAdmin = async (req, res, next) => {
  try {
    await prisma.users.update({
      where: { id: BigInt(req.params.id) },
      data: { deleted_at: new Date() },
    });
    return success(res, null, 'Admin deleted successfully');
  } catch (err) {
    next(err);
  }
};

// User management
const getUsers = async (req, res, next) => {
  try {
    const { page, perPage } = getPaginationParams(req.query);
    const { search } = req.query;

    const where = { deleted_at: null };
    if (search) {
      where.OR = [
        { first_name: { contains: search } },
        { last_name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * perPage,
        take: perPage,
      }),
      prisma.users.count({ where }),
    ]);

    const result = await Promise.all(users.map(async (u) => {
      const media = await getMediaForModel('App\\Models\\User', u.id, 'profile_picture');
      const roles = await prisma.$queryRawUnsafe(
        `SELECT r.name FROM roles r INNER JOIN model_has_roles mhr ON mhr.role_id = r.id
         WHERE mhr.model_type = 'App\\\\Models\\\\User' AND mhr.model_id = ?`,
        u.id
      );
      return {
        id: Number(u.id),
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        phone: u.phone,
        status: u.status,
        is_banned: u.is_banned,
        profile_picture: media.length > 0 ? media[0].url : null,
        roles: roles.map((r) => r.name),
        created_at: u.created_at,
      };
    }));

    return success(res, {
      data: result,
      pagination: { current_page: page, last_page: Math.ceil(total / perPage), total, per_page: perPage },
    }, 'Users fetched');
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    await prisma.users.update({
      where: { id: BigInt(req.params.id) },
      data: { deleted_at: new Date() },
    });
    return success(res, null, 'User deleted successfully');
  } catch (err) {
    next(err);
  }
};

const updateUserPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return error(res, 'Password must be at least 8 characters', 422);
    }

    const user = await prisma.users.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!user) return notFound(res, 'User not found');

    const hashedPassword = await bcrypt.hash(password, bcryptRounds);
    await prisma.users.update({
      where: { id: user.id },
      data: { password: hashedPassword, updated_at: new Date() },
    });

    return success(res, null, 'User password updated successfully');
  } catch (err) {
    next(err);
  }
};

const toggleBan = async (req, res, next) => {
  try {
    const user = await prisma.users.findUnique({ where: { id: BigInt(req.params.id) } });
    if (!user) return notFound(res, 'User not found');

    await prisma.users.update({
      where: { id: user.id },
      data: { is_banned: !user.is_banned, updated_at: new Date() },
    });

    return success(res, { is_banned: !user.is_banned }, user.is_banned ? 'User unbanned' : 'User banned');
  } catch (err) {
    next(err);
  }
};

module.exports = { getAdmins, storeAdmin, updateAdmin, deleteAdmin, getUsers, deleteUser, updateUserPassword, toggleBan };
