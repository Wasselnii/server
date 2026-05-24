import { z } from "zod";

export const createBookingSchema = z.object({
    rideId: z.number()
    .int("rideId must be an integer")
    .positive("rideId must be a positive number"),
});