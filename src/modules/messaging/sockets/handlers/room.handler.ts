import { Socket, Server as IOServer } from "socket.io";
import { RoomsService } from "../../services/rooms.service.js";

interface RoomPayload {
    roomId: number;
}

export function registerRoomHandlers(socket: Socket, io: IOServer) {
    socket.on("join_room", async (payload: RoomPayload) => {
        try {
            const roomId = Number(payload?.roomId);
            if (isNaN(roomId)) {
                socket.emit("error", { event: "join_room", message: "Invalid roomId" });
                return;
            }

            const isMember = await RoomsService.isMember(roomId, socket.userId);
            if (!isMember) {
                socket.emit("error", {
                    event: "join_room",
                    message: "You are not a member of this room",
                });
                return;
            }

            const roomKey = String(roomId);
            await socket.join(roomKey);

            socket.emit("room_joined", { roomId });

            socket.to(roomKey).emit("user_joined", {
                roomId,
                user: {
                    id: socket.userId,
                    fullName: socket.userFullName,
                },
            });
        } catch (err) {
            console.error("[join_room] error:", err);
            socket.emit("error", { event: "join_room", message: "Failed to join room" });
        }
    });

    socket.on("leave_room", async (payload: RoomPayload) => {
        try {
            const roomId = Number(payload?.roomId);
            if (isNaN(roomId)) {
                socket.emit("error", { event: "leave_room", message: "Invalid roomId" });
                return;
            }

            const roomKey = String(roomId);
            await socket.leave(roomKey);

            socket.emit("room_left", { roomId });

            io.to(roomKey).emit("user_left", {
                roomId,
                user: {
                    id: socket.userId,
                    fullName: socket.userFullName,
                },
            });
        } catch (err) {
            console.error("[leave_room] error:", err);
            socket.emit("error", { event: "leave_room", message: "Failed to leave room" });
        }
    });

    socket.on("disconnecting", () => {
        for (const roomKey of socket.rooms) {
            if (roomKey === socket.id) continue;

            socket.to(roomKey).emit("user_left", {
                roomId: Number(roomKey),
                user: {
                    id: socket.userId,
                    fullName: socket.userFullName,
                },
            });
        }
    });
}
