import { Router } from "express";
import {
    createRoom,
    createPrivateRoom,
    joinRoom,
    leaveRoom,
    getMyRooms,
    getRoomById,
    getRoomMessages,
} from "../controllers/rooms.controller.js";
import { authenticateToken } from "../../../core/middleware/auth.middleware.js";

const roomsRouter = Router();

roomsRouter.use(authenticateToken);

roomsRouter.get("/", getMyRooms);
roomsRouter.post("/", createRoom);
roomsRouter.post("/private", createPrivateRoom);
roomsRouter.get("/:id", getRoomById);

roomsRouter.post("/:id/join", joinRoom);
roomsRouter.delete("/:id/leave", leaveRoom);

roomsRouter.get("/:id/messages", getRoomMessages);

export default roomsRouter;
