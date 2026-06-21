import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160).transform((email) => email.toLowerCase()),
  password: z.string().min(8).max(128)
});

export const loginSchema = z.object({
  email: z.string().trim().email().transform((email) => email.toLowerCase()),
  password: z.string().min(1)
});

export const footprintSchema = z.object({
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  transportKm: z.number().min(0).max(50000),
  transportMode: z.enum(["walk_bike", "public_transit", "car", "electric_car", "flight"]),
  electricityKwh: z.number().min(0).max(10000),
  gasKwh: z.number().min(0).max(10000),
  dietType: z.enum(["plant_based", "vegetarian", "mixed", "meat_heavy"]),
  meals: z.number().int().min(0).max(12),
  purchasesAmount: z.number().min(0).max(100000),
  notes: z.string().max(500).optional()
});

export const actionSchema = z.object({
  actionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().min(3).max(240),
  estimatedSavingsKg: z.number().min(0).max(10000)
});
