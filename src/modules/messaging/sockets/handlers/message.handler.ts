import { Socket, Server as IOServer } from "socket.io";
import { MessagesService } from "../../services/messages.service.js";
import { RoomsService } from "../../services/rooms.service.js";
import { validateMessage } from "../../../../core/utils/sanitize.js";
import { createSocketRateLimiter } from "../../../../core/utils/socketRateLimiter.js";

const msgLimiter = createSocketRateLimiter({ maxRequests: 10, windowMs: 5_000 });

interface SendMessagePayload {
    roomId: number;
    text: string;
    clientId?: string; 
}

export function registerMessageHandlers(socket: Socket, io: IOServer) {
    socket.on("send_message", async (payload: SendMessagePayload) => {
        try {
            // ── 1. Rate limit ─────────────────────────────────────────────
            if (!msgLimiter.check(socket.id)) {
                socket.emit("error", {
                    event: "send_message",
                    message: "Slow down — you are sending messages too fast",
                });
                return;
            }

            if (!payload || typeof payload !== "object") {
                socket.emit("error", { event: "send_message", message: "Invalid payload" });
                return;
            }

            const roomId = Number(payload.roomId);
            if (isNaN(roomId)) {
                socket.emit("error", { event: "send_message", message: "Invalid roomId" });
                return;
            }

            let sanitizedText: string;
            try {
                sanitizedText = validateMessage(payload.text);
            } catch (err: unknown) {
                socket.emit("error", {
                    event: "send_message",
                    message: (err as Error).message,
                });
                return;
            }

            const isMember = await RoomsService.isMember(roomId, socket.userId);
            if (!isMember) {
                socket.emit("error", {
                    event: "send_message",
                    message: "You are not a member of this room",
                });
                return;
            }

            const message = await MessagesService.create({
                text: sanitizedText,
                userId: socket.userId,
                roomId,
                clientId: payload.clientId,
            });

            io.to(String(roomId)).emit("receive_message", {
                id: message.id,
                text: message.text,
                roomId: message.roomId,
                clientId: message.clientId,
                createdAt: message.createdAt,
                user: message.user,
            });
        } catch (err) {
            console.error("[send_message] unexpected error:", err);
            socket.emit("error", {
                event: "send_message",
                message: "Failed to send message",
            });
        }
    });

    socket.on("disconnect", () => {
        msgLimiter.remove(socket.id);
    });
}
