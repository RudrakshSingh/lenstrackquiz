// lib/validation.js
// Validation schemas using Zod

import { z } from 'zod';

// User schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'STORE_MANAGER', 'SALES_EXECUTIVE']),
  storeId: z.string().uuid().optional().nullable(),
  employeeId: z.string().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone format').optional()
});

export const UpdateUserSchema = CreateUserSchema.partial().extend({
  password: z.string().min(8).optional()
});

// Store schemas
export const CreateStoreSchema = z.object({
  code: z.string().min(1, 'Store code is required'),
  name: z.string().min(1, 'Store name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  gstNumber: z.string().optional()
});

export const UpdateStoreSchema = CreateStoreSchema.partial().extend({
  email: z.string().email().optional().nullable().or(z.literal('')),
  isActive: z.boolean().optional()
});

// Product schemas
export const CreateProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional().nullable(),
  category: z.enum(['EYEGLASSES', 'SUNGLASSES', 'CONTACT_LENSES', 'ACCESSORIES']),
  brand: z.string().optional().nullable(),
  basePrice: z.union([
    z.number(),
    z.string().transform(val => parseFloat(val))
  ]).pipe(z.number().min(0, 'Price must be positive')),
  imageUrl: z.union([
    z.string().url(),
    z.string().length(0),
    z.null(),
    z.undefined()
  ]).optional().nullable(),
  features: z.array(z.object({
    featureId: z.string(),
    strength: z.number().min(0.1).max(2.0).optional()
  })).optional()
});

// Question schemas
export const CreateQuestionSchema = z.object({
  key: z.string().min(1, 'Question key is required'),
  textEn: z.string().min(1, 'English text is required'),
  textHi: z.string().optional(),
  textHiEn: z.string().optional(),
  category: z.enum(['EYEGLASSES', 'SUNGLASSES', 'CONTACT_LENSES', 'ACCESSORIES']),
  order: z.number().int().min(0).default(0),
  isRequired: z.boolean().default(true),
  allowMultiple: z.boolean().default(false),
  showIf: z.any().optional(),
  options: z.array(z.object({
    key: z.string(),
    textEn: z.string(),
    textHi: z.string().optional(),
    textHiEn: z.string().optional(),
    icon: z.string().optional(),
    order: z.number().int().default(0)
  })).optional(),
  mappings: z.array(z.object({
    optionKey: z.string(),
    featureKey: z.string(),
    weight: z.number().min(-2.0).max(2.0).default(1.0)
  })).optional()
});

// Session schemas
export const CreateSessionSchema = z.object({
  category: z.enum(['EYEGLASSES', 'SUNGLASSES', 'CONTACT_LENSES', 'ACCESSORIES']),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional()
});

export const AnswerQuestionSchema = z.object({
  questionId: z.string(),
  optionIds: z.array(z.string()).min(1, 'At least one option is required')
});

/**
 * Validate request body against schema
 */
export function validate(schema) {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details = {};
        error.errors.forEach(err => {
          const path = err.path.join('.');
          if (!details[path]) {
            details[path] = [];
          }
          details[path].push(err.message);
        });
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details
          }
        });
      }
      next(error);
    }
  };
}
