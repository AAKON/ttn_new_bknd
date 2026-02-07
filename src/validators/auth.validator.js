const { z } = require('zod');

const registerSchema = z.object({
  user_type: z.string().max(20).optional(),
  first_name: z.string().min(1).max(255),
  last_name: z.string().min(1).max(255),
  email: z.string().email().max(255),
  password: z.string().min(8),
  password_confirmation: z.string().min(8).optional(),
});

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1),
});

const googleLoginSchema = z.object({
  email: z.string().email().max(255),
  token: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email().max(255),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  password: z.string().min(8),
  password_confirmation: z.string().min(8).optional(),
});

const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8),
  new_password_confirmation: z.string().min(8).optional(),
});

const updateProfileSchema = z.object({
  first_name: z.string().max(255).optional(),
  last_name: z.string().max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(255).optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
};
