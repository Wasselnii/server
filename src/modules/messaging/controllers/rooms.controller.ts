import { Request, Response } from "express";
import { asyncHandler } from "../../../core/utils/asyncHandler.js";
import { AppError } from "../../../core/errors/AppError.js";
import { RoomsService } from "../services/rooms.service.js";
import { MessagesService } from "../services/messages.service.js";

export const createRoom = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) throw AppError.unauthorized();

    const { name, memberIds } = req.body as {
        name: string;
        memberIds?: number[];
    };

    if (!name?.trim()) throw AppError.badRequest("Room name is required");

    const room = await RoomsService.createGroup(name.trim(), userId, memberIds);
    return res.status(201).json({ message: "Room created", room });
});

export const createPrivateRoom = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.userId;
        if (!userId) throw AppError.unauthorized();

        const { targetUserId } = req.body as { targetUserId: number };
        if (!targetUserId) throw AppError.badRequest("targetUserId is required");
        if (targetUserId === userId)
            throw AppError.badRequest("Cannot start a chat with yourself");

        const { room, created } = await RoomsService.createOrFindPrivate(
            userId,
            targetUserId,
        );

        return res.status(created ? 201 : 200).json({ room });
    },
);

export const joinRoom = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) throw AppError.unauthorized();

    const roomId = parseInt(String(req.params.id), 10);
    if (isNaN(roomId)) throw AppError.badRequest("Invalid roomId");

    const member = await RoomsService.addMember(roomId, userId);
    return res.status(200).json({ message: "Joined room", member });
});

export const leaveRoom = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) throw AppError.unauthorized();

    const roomId = parseInt(String(req.params.id), 10);
    if (isNaN(roomId)) throw AppError.badRequest("Invalid roomId");

    await RoomsService.removeMember(roomId, userId);
    return res.status(200).json({ message: "Left room" });
});

// ── GET /rooms ────────────────────────────────────────────────────────────────
export const getMyRooms = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) throw AppError.unauthorized();

    const rooms = await RoomsService.getMyRooms(userId);
    return res.status(200).json({ rooms });
});

export const getRoomById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) throw AppError.unauthorized();

    const roomId = parseInt(String(req.params.id), 10);
    if (isNaN(roomId)) throw AppError.badRequest("Invalid roomId");

    // Ensure requester is a member before returning room data
    await RoomsService.assertMember(roomId, userId);

    const room = await RoomsService.getById(roomId);
    return res.status(200).json({ room });
});

export const getRoomMessages = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.userId;
        if (!userId) throw AppError.unauthorized();

        const roomId = parseInt(String(req.params.id), 10);
        if (isNaN(roomId)) throw AppError.badRequest("Invalid roomId");

        await RoomsService.assertMember(roomId, userId);

        const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
        const limit = req.query.limit ? Number(req.query.limit) : 50;

        const messages = await MessagesService.getHistory(roomId, cursor, limit);
        return res.status(200).json({ messages });
    },
);
