import { Socket } from "socket.io";
import { RoomsService } from "../../services/rooms.service.js";
import { createSocketRateLimiter } from "../../../../core/utils/socketRateLimiter.js";

const typingLimiter = createSocketRateLimiter({ maxRequests: 5, windowMs: 3_000 });

interface TypingPayload {
    roomId: number;
}

export function registerTypingHandlers(socket: Socket) {
    socket.on("typing", async (payload: TypingPayload) => {
        if (!typingLimiter.check(socket.id)) return; 

        const roomId = Number(payload?.roomId);
        if (isNaN(roomId)) return;

        if (!socket.rooms.has(String(roomId))) return;

        const isMember = await RoomsService.isMember(roomId, socket.userId);
        if (!isMember) return;

        socket.to(String(roomId)).emit("typing", {
            roomId,
            user: {
                id: socket.userId,
                fullName: socket.userFullName,
            },
        });
    });

    socket.on("stop_typing", async (payload: TypingPayload) => {
        const roomId = Number(payload?.roomId);
        if (isNaN(roomId)) return;

        if (!socket.rooms.has(String(roomId))) return;

        socket.to(String(roomId)).emit("stop_typing", {
            roomId,
            user: {
                id: socket.userId,
                fullName: socket.userFullName,
            },
        });
    });

    socket.on("disconnect", () => {
        typingLimiter.remove(socket.id);
    });
}
