import { Request, Response } from "express";
import prisma from "../../config/prisma.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { AppError } from "../../core/errors/AppError.js";
import {
    checkPhoneVerified,
    consumeVerifiedPhone,
} from "../otp/controller.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
    const { credential } = req.body;
    if (!credential) {
        throw AppError.badRequest("Google token missing");
    }

    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) throw AppError.badRequest("Invalid Google Payload");

    let isNewUser = false;
    let user = await prisma.user.findUnique({
        where: { email: payload.email },
    });

    if (!user) {
        isNewUser = true;
        user = await prisma.user.create({
            data: {
                email: payload.email,
                fullName: payload.name || "Google User",
                googleId: payload.sub,
                avatar: payload.picture,
                emailVerified: true,
            },
        });
    }

    const token = jwt.sign(
        { sub: String(user.id), role: user.role },
        process.env.JWT_SECRET!,
        {
            expiresIn: "1d",
        },
    );
    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
        message: "Google Auth successful",
        user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            avatar: user.avatar,
        },
        isNewUser,
    });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { phone, password } = req.body;
    const invalidCredentialsMessage = "Invalid phone or password";

    if (!phone || !password) {
        throw AppError.badRequest("Phone and password are required");
    }

    const user = await prisma.user.findUnique({
        where: { phone },
    });

    if (!user || !user.password) {
        throw AppError.badRequest(invalidCredentialsMessage);
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw AppError.badRequest(invalidCredentialsMessage);
    }

    const token = jwt.sign(
        { sub: String(user.id), role: user.role },
        process.env.JWT_SECRET!,
        {
            expiresIn: "1d",
        },
    );

    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
        message: "Login successful",
        user: {
            id: user.id,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
        },
    });
});

export const signup = asyncHandler(async (req: Request, res: Response) => {
    const { fullName, email, password, role, phone } = req.body;
    const resolvedEmail = (email || `${phone}@wasselni.local`).trim();

    if (!fullName || !password || !phone) {
        throw AppError.badRequest("Full name, phone and password are required");
    }

    if (!checkPhoneVerified(phone)) {
        throw AppError.badRequest(
            "Phone number not verified. Please complete OTP verification first.",
        );
    }

    const existingEmail = await prisma.user.findUnique({
        where: { email: resolvedEmail },
    });
    if (existingEmail) throw AppError.conflict("Email already used");

    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) throw AppError.conflict("Phone number already used");

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            fullName,
            email: resolvedEmail,
            password: hashedPassword,
            role,
            phone,
            phoneVerified: true,
        },
    });

    consumeVerifiedPhone(phone);

    const token = jwt.sign(
        { sub: String(user.id), role: user.role },
        process.env.JWT_SECRET!,
        { expiresIn: "5d" },
    );

    res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
        message: "Signup successful",
        user: {
            id: user.id,
            fullName: user.fullName,
            phone: user.phone,
            email: user.email,
            role: user.role,
        },
    });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
    res.clearCookie("jwt", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
    });
    return res.status(200).json({
        message: "Logout successful",
    });
});

export const getCurrentUser = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.userId;
        if (!userId) {
            throw AppError.unauthorized();
        }
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                phone: true,
                gender: true,
                dateOfBirth: true,
                bio: true,
                avatar: true,
            },
        });

        if (!user) {
            throw AppError.notFound("User");
        }

        return res.status(200).json({
            message: "About me",
            user: user,
        });
    },
);
