import { z } from "zod";

export const createRideSchema = z.object({
    origin: z.string().min(1, "Origin is required").trim(),
    destination: z.string().min(1, "Destination is required").trim(),
    departure: z.string().datetime({ message: "Invalid departure datetime" }),
    price: z.number().positive("Price must be positive"),
    seats: z.number().int().positive("Seats must be a positive integer"),
    description: z.string().max(500, "500 characters at max").optional(),
});

export const updateRideSchema = z.object({
    origin: z.string().trim().min(1).optional(),
    destination: z.string().trim().min(1).optional(),
    departure: z
        .string()
        .datetime({ message: "Invalid departure datetime" })
        .optional(),
    price: z.number().positive("Price must be positive").optional(),
    seats: z
        .number()
        .int()
        .positive("Seats must be a positive integer")
        .optional(),
    description: z.string().max(500, "500 characters at max").optional(),
    status: z
        .enum(["ACTIVE", "FULL", "CANCELLED", "COMPLETED", "IN_PROGRESS"])
        .optional(),
});

export const searchSchema = z.object({
    origin: z.string().trim().optional(),
    destination: z.string().trim().optional(),
    departure: z.coerce.date().optional(),
    seats: z.coerce.number().int().positive().optional(),
    price: z.coerce.number().nonnegative().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    sortBy: z.enum(["price", "departure", "rating"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
});
