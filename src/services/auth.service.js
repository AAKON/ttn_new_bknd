const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../config/database');
const { jwtSecret, jwtExpiresIn, bcryptRounds } = require('../config/auth');
const { getMediaForModel } = require('./media.service');
const { sendOTPEmail } = require('./email.service');

const generateToken = (user) => {
  return jwt.sign(
    { id: Number(user.id), email: user.email },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  );
};

const register = async ({ first_name, last_name, email, password, user_type }) => {
  const existing = await prisma.users.findUnique({ where: { email } });
  if (existing) {
    throw { statusCode: 422, message: 'Email already exists' };
  }

  const hashedPassword = await bcrypt.hash(password, bcryptRounds);

  const user = await prisma.users.create({
    data: {
      uuid: uuidv4(),
      first_name,
      last_name,
      email,
      password: hashedPassword,
      status: 'pending',
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  // Assign 'user' role
  await assignRole(user.id, 'user');

  // Assign additional role if provided (buyer, seller, talent)
  if (user_type && ['buyer', 'seller', 'talent'].includes(user_type)) {
    await assignRole(user.id, user_type);
  }

  const token = generateToken(user);

  return {
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    profile_picture: null,
    token_type: 'Bearer',
    access_token: token,
  };
};

const login = async ({ email, password }) => {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    throw { statusCode: 401, message: 'Invalid login credentials' };
  }

  if (user.is_banned) {
    throw { statusCode: 403, message: 'Your account has been banned' };
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw { statusCode: 401, message: 'Invalid login credentials' };
  }

  const token = generateToken(user);

  // Get profile picture
  const media = await getMediaForModel('App\\Models\\User', user.id, 'profile_picture');
  const profilePic = media.length > 0 ? media[0].url : null;

  // Get roles
  const roles = await prisma.$queryRawUnsafe(
    `SELECT r.name FROM roles r
     INNER JOIN model_has_roles mhr ON mhr.role_id = r.id
     WHERE mhr.model_type = 'App\\\\Models\\\\User' AND mhr.model_id = ?`,
    user.id
  );

  return {
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    profile_picture: profilePic,
    token_type: 'Bearer',
    access_token: token,
    roles: roles.map(r => r.name),
  };
};

const googleLogin = async ({ email, token: googleToken }) => {
  let user = await prisma.users.findUnique({ where: { email } });

  if (!user) {
    // Create new user from Google
    user = await prisma.users.create({
      data: {
        uuid: uuidv4(),
        first_name: email.split('@')[0],
        last_name: '',
        email,
        password: await bcrypt.hash(uuidv4(), bcryptRounds),
        status: 'approved',
        email_verified_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      },
    });
    await assignRole(user.id, 'user');
  }

  if (user.is_banned) {
    throw { statusCode: 403, message: 'Your account has been banned' };
  }

  const jwtToken = generateToken(user);

  const media = await getMediaForModel('App\\Models\\User', user.id, 'profile_picture');
  const profilePic = media.length > 0 ? media[0].url : null;

  // Get roles
  const roles = await prisma.$queryRawUnsafe(
    `SELECT r.name FROM roles r
     INNER JOIN model_has_roles mhr ON mhr.role_id = r.id
     WHERE mhr.model_type = 'App\\\\Models\\\\User' AND mhr.model_id = ?`,
    user.id
  );

  return {
    name: `${user.first_name} ${user.last_name}`,
    email: user.email,
    profile_picture: profilePic,
    token_type: 'Bearer',
    access_token: jwtToken,
    roles: roles.map(r => r.name),
  };
};

const getProfile = async (userId) => {
  const user = await prisma.users.findUnique({
    where: { id: userId },
  });

  if (!user) throw { statusCode: 404, message: 'User not found' };

  const media = await getMediaForModel('App\\Models\\User', user.id, 'profile_picture');
  const profilePic = media.length > 0 ? media[0].url : null;

  // Get roles
  const roles = await prisma.$queryRawUnsafe(
    `SELECT r.name FROM roles r
     INNER JOIN model_has_roles mhr ON mhr.role_id = r.id
     WHERE mhr.model_type = 'App\\\\Models\\\\User' AND mhr.model_id = ?`,
    userId
  );

  // Get permissions
  const roleIds = roles.map(r => r.id).filter(Boolean);
  let permissions = [];
  if (roleIds.length > 0) {
    permissions = await prisma.$queryRawUnsafe(
      `SELECT DISTINCT p.name FROM permissions p
       INNER JOIN role_has_permissions rhp ON rhp.permission_id = p.id
       INNER JOIN model_has_roles mhr ON mhr.role_id = rhp.role_id
       WHERE mhr.model_type = 'App\\\\Models\\\\User' AND mhr.model_id = ?`,
      userId
    );
  }

  return {
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone: user.phone,
    profile_picture: profilePic,
    roles: roles.map(r => r.name),
    permissions: permissions.map(p => p.name),
  };
};

const updateProfile = async (userId, data, file) => {
  const updateData = {
    updated_at: new Date(),
  };

  if (data.first_name) updateData.first_name = data.first_name;
  if (data.last_name) updateData.last_name = data.last_name;
  if (data.email) updateData.email = data.email;
  if (data.phone !== undefined) updateData.phone = data.phone;

  await prisma.users.update({
    where: { id: userId },
    data: updateData,
  });

  // Handle profile image upload
  if (file) {
    const { addMedia, deleteAllMediaForModel } = require('./media.service');
    await deleteAllMediaForModel('App\\Models\\User', userId);
    await addMedia(file, 'App\\Models\\User', userId, 'profile_picture');
  }

  return getProfile(userId);
};

const changePassword = async (userId, { current_password, new_password }) => {
  const user = await prisma.users.findUnique({ where: { id: userId } });
  if (!user) throw { statusCode: 404, message: 'User not found' };

  const isValid = await bcrypt.compare(current_password, user.password);
  if (!isValid) {
    throw { statusCode: 422, message: 'Current password is incorrect' };
  }

  const hashedPassword = await bcrypt.hash(new_password, bcryptRounds);
  await prisma.users.update({
    where: { id: userId },
    data: { password: hashedPassword, updated_at: new Date() },
  });

  return true;
};

const forgotPassword = async ({ email }) => {
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    throw { statusCode: 404, message: 'User not found with this email' };
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await prisma.password_resets.create({
    data: {
      email,
      otp,
      expires_at: expiresAt,
      is_used: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });

  // Send OTP email
  try {
    await sendOTPEmail(email, otp);
  } catch (err) {
    console.error('Failed to send OTP email:', err.message);
  }

  return true;
};

const resetPassword = async ({ email, otp, password }) => {
  const resetRecord = await prisma.password_resets.findFirst({
    where: {
      email,
      otp,
      is_used: false,
    },
    orderBy: { created_at: 'desc' },
  });

  if (!resetRecord) {
    throw { statusCode: 422, message: 'Invalid OTP' };
  }

  if (new Date(resetRecord.expires_at) < new Date()) {
    throw { statusCode: 422, message: 'OTP has expired' };
  }

  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) throw { statusCode: 404, message: 'User not found' };

  const hashedPassword = await bcrypt.hash(password, bcryptRounds);

  await prisma.users.update({
    where: { id: user.id },
    data: { password: hashedPassword, updated_at: new Date() },
  });

  // Mark OTP as used
  await prisma.password_resets.update({
    where: { id: resetRecord.id },
    data: { is_used: true, updated_at: new Date() },
  });

  return true;
};

const assignRole = async (userId, roleName) => {
  const role = await prisma.roles.findFirst({
    where: { name: roleName, guard_name: 'web' },
  });

  if (role) {
    try {
      await prisma.$queryRawUnsafe(
        `INSERT IGNORE INTO model_has_roles (role_id, model_type, model_id) VALUES (?, 'App\\\\Models\\\\User', ?)`,
        role.id,
        userId
      );
    } catch (err) {
      // Ignore duplicate entry errors
    }
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  generateToken,
  assignRole,
};
