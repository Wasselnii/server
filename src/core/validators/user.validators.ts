import { z } from "zod";

export const loginBodySchema = z.object({
    phone: z
        .string()
        .length(10, "Phone number must be exactly 10 digits")
        .regex(/^0[5-7]\d{8}$/, "Invalid Algerian phone number"),
    password: z.string().trim().min(5).max(20),
    rememberMe: z.boolean().optional(),
});

export const signupBodySchema = z.object({
    fullName: z.string().trim().min(2).max(100),
    phone: z
        .string()
        .length(10, "Phone number must be exactly 10 digits")
        .regex(/^0[5-7]\d{8}$/, "Invalid Algerian phone number"),
    password: z.string().trim().min(5).max(20),
    role: z.enum(["DRIVER", "PASSENGER"]).default("PASSENGER"),
});

export const updateProfileSchema = z.object({
    fullName: z.string().trim().min(2).max(100).optional(),
    bio: z.string().trim().max(500).optional(),
    phone: z
        .string()
        .length(10, "Phone number must be exactly 10 digits")
        .regex(/^0[5-7]\d{8}$/, "Invalid Algerian phone number")
        .optional(),
    avatar: z.string().url().optional(),
    gender: z.enum(["MALE", "FEMALE"]).optional(),
    role: z.enum(["PASSENGER", "DRIVER"]).optional(),
});

export const usernameParamSchema = z.object({
    username: z
        .string()
        .min(3, "Too short")
        .max(10, "max length")
        .regex(/^[a-zA-Z0-9_.]+$/, "Alphanumeric only"),
});

export const createReviewSchema = z.object({
    rideId: z.number().int().positive(),
    rating: z.number().int().min(1).max(5),
    comment: z.string().max(500).optional(),
});

export const phoneBodySchema = z.object({
    phone: z
        .string()
        .length(10, "Phone number must be exactly 10 digits")
        .regex(/^0[5-7]\d{8}$/, "Invalid Algerian phone number"),
    otp: z.string().trim().optional(),
});

export const resetPasswordSchema = z.object({
    phone: z
        .string()
        .length(10, "Phone number must be exactly 10 digits")
        .regex(/^0[5-7]\d{8}$/, "Invalid Algerian phone number"),
    newPassword: z.string().trim().min(5).max(20),
});
