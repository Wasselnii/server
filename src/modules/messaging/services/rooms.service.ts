import prisma from "../../../config/prisma.js";
import { AppError } from "../../../core/errors/AppError.js";

export const RoomsService = {

    async createGroup(name: string, creatorId: number, memberIds: number[] = []) {
        const uniqueMembers = Array.from(new Set([creatorId, ...memberIds]));

        return prisma.room.create({
            data: {
                name,
                type: "GROUP",
                members: {
                    create: uniqueMembers.map((userId) => ({ userId })),
                },
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, fullName: true, avatar: true } },
                    },
                },
            },
        });
    },


    async createOrFindPrivate(userAId: number, userBId: number) {
        // Look for an existing private room shared by both users
        const existing = await prisma.room.findFirst({
            where: {
                type: "PRIVATE",
                members: { some: { userId: userAId } },
                AND: {
                    members: { some: { userId: userBId } },
                },
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, fullName: true, avatar: true } },
                    },
                },
            },
        });

        if (existing) return { room: existing, created: false };

        const room = await prisma.room.create({
            data: {
                type: "PRIVATE",
                members: {
                    create: [{ userId: userAId }, { userId: userBId }],
                },
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, fullName: true, avatar: true } },
                    },
                },
            },
        });

        return { room, created: true };
    },

    // ── Membership ────────────────────────────────────────────────────────────

    async addMember(roomId: number, userId: number) {
        const room = await prisma.room.findUnique({ where: { id: roomId } });
        if (!room) throw AppError.notFound("Room");
        if (room.type === "PRIVATE") {
            throw AppError.forbidden("Cannot manually add members to a private chat");
        }

        // upsert so repeated calls are idempotent
        return prisma.roomMember.upsert({
            where: { userId_roomId: { userId, roomId } },
            update: {},
            create: { userId, roomId },
        });
    },

    async removeMember(roomId: number, userId: number) {
        return prisma.roomMember.deleteMany({ where: { roomId, userId } });
    },

    // ── Guards ────────────────────────────────────────────────────────────────

    async assertMember(roomId: number, userId: number) {
        const member = await prisma.roomMember.findUnique({
            where: { userId_roomId: { userId, roomId } },
        });
        if (!member) throw AppError.forbidden("You are not a member of this room");
        return member;
    },

    async isMember(roomId: number, userId: number): Promise<boolean> {
        const member = await prisma.roomMember.findUnique({
            where: { userId_roomId: { userId, roomId } },
        });
        return member !== null;
    },

    // ── Read ──────────────────────────────────────────────────────────────────

    async getById(roomId: number) {
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, fullName: true, avatar: true } },
                    },
                },
            },
        });
        if (!room) throw AppError.notFound("Room");
        return room;
    },

    async getMyRooms(userId: number) {
        return prisma.room.findMany({
            where: { members: { some: { userId } } },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, fullName: true, avatar: true } },
                    },
                },
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                    include: {
                        user: { select: { id: true, fullName: true } },
                    },
                },
            },
            orderBy: { updatedAt: "desc" },
        });
    },
};
