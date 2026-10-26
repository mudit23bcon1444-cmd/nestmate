// validators/schemas.js — Zod request validation schemas for write routes
const { z } = require('zod');

const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().email('Invalid email address.').toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
  role: z.enum(['student', 'owner']).optional().default('student')
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address.').toLowerCase(),
  password: z.string().min(1, 'Password is required.')
});

const sendOtpSchema = z.object({
  phone: z.string().trim().min(10, 'Phone number must be at least 10 digits.')
});

const verifyOtpSchema = z.object({
  phone: z.string().trim().min(10, 'Phone number is required.'),
  otp: z.string().trim().length(6, 'OTP must be exactly 6 digits.')
});

const completeProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().email('Invalid email address.').toLowerCase(),
  role: z.enum(['student', 'owner']).optional().default('student')
});

const createBookingSchema = z.object({
  listing_id: z.string().trim().min(1, 'Listing ID is required.'),
  move_in_date: z.string().trim().min(1, 'Move-in date is required.'),
  message: z.string().trim().optional()
});

const updateBookingStatusSchema = z.object({
  status: z.enum(['accepted', 'rejected'], {
    errorMap: () => ({ message: 'Status must be "accepted" or "rejected".' })
  })
});

const createListingSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters.').max(100),
  location: z.string().trim().min(3, 'Location must be at least 3 characters.').max(100),
  price: z.coerce.number().positive('Price must be a positive number.'),
  description: z.string().trim().optional(),
  room_type: z.enum(['single', 'shared', 'studio', 'apartment']).optional().default('single'),
  amenities: z.union([z.array(z.string()), z.string()]).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional()
});

const updateListingSchema = z.object({
  title: z.string().trim().min(3).max(100).optional(),
  location: z.string().trim().min(3).max(100).optional(),
  price: z.coerce.number().positive().optional(),
  description: z.string().trim().optional(),
  room_type: z.enum(['single', 'shared', 'studio', 'apartment']).optional(),
  amenities: z.union([z.array(z.string()), z.string()]).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional()
});

module.exports = {
  registerSchema,
  loginSchema,
  sendOtpSchema,
  verifyOtpSchema,
  completeProfileSchema,
  createBookingSchema,
  updateBookingStatusSchema,
  createListingSchema,
  updateListingSchema
};
