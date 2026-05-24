import prisma from "../../../config/prisma.js";

export interface CreateMessageInput {
    text: string;
    userId: number;
    roomId: number;
    clientId?: string;
}

export const MessagesService = {

    async create(data: CreateMessageInput) {
        if (data.clientId) {
            const existing = await prisma.message.findUnique({
                where: { clientId: data.clientId },
                include: {
                    user: { select: { id: true, fullName: true, avatar: true } },
                },
            });
            if (existing) return existing;
        }

        return prisma.message.create({
            data: {
                text: data.text,
                userId: data.userId,
                roomId: data.roomId,
                clientId: data.clientId,
            },
            include: {
                user: { select: { id: true, fullName: true, avatar: true } },
            },
        });
    },

    /**
     * Paginated history for a room.
     * Returns messages in ascending chronological order.
     *
     * @param roomId   - The room to query.
     * @param cursor   - The last message id received (for cursor pagination).
     * @param limit    - Page size (default 50, max 100).
     */
    async getHistory(roomId: number, cursor?: number, limit = 50) {
        const take = Math.min(limit, 100);

        const messages = await prisma.message.findMany({
            where: {
                roomId,
                ...(cursor ? { id: { lt: cursor } } : {}),
            },
            include: {
                user: { select: { id: true, fullName: true, avatar: true } },
            },
            orderBy: { createdAt: "desc" },
            take,
        });

        return messages.reverse();
    },
};
