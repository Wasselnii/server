import { Server as HTTPServer } from "http";
import { Server as IOServer } from "socket.io";
import { socketAuthMiddleware } from "../../../core/middleware/socket.auth.js";
import { registerMessageHandlers } from "./handlers/message.handler.js";
import { registerRoomHandlers } from "./handlers/room.handler.js";
import { registerTypingHandlers } from "./handlers/typing.handler.js";

/**
 * Initialise and return a Socket.IO server attached to the given HTTP server.
 *
 * Call this ONCE from app.ts, passing the `http.Server` instance.
 *
 * @example
 *   const httpServer = createServer(app);
 *   initSocketServer(httpServer);
 *   httpServer.listen(PORT);
 */
export function initSocketServer(httpServer: HTTPServer): IOServer {
    const io = new IOServer(httpServer, {
        transports: ["websocket", "polling"],
        pingTimeout: 60_000,    
        pingInterval: 25_000,    

        cors: {
            origin: process.env.CLIENT_URL ?? "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true,
        },
    });


    io.use(socketAuthMiddleware);


    io.on("connection", (socket) => {
        console.log(
            `[socket] connected  id=${socket.id}  userId=${socket.userId}`,
        );

        registerRoomHandlers(socket, io);
        registerMessageHandlers(socket, io);
        registerTypingHandlers(socket);

  
        socket.on("error", (err: Error) => {
            console.warn(`[socket] error on ${socket.id}: ${err.message}`);
        });

        socket.on("disconnect", (reason) => {
            console.log(
                `[socket] disconnected  id=${socket.id}  reason=${reason}`,
            );
        });
    });


    io.engine.on("connection_error", (err) => {
        console.warn("[socket] connection error:", err.code, err.message);
    });

    return io;
}
