import { Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { authPayloadSchema } from "../validators/auth.validators.js";

declare module "socket.io" {
    interface Socket {
        userId: number;
        userFullName: string;
    }
}


export function socketAuthMiddleware(
    socket: Socket,
    next: (err?: Error) => void,
): void {
    try {
        const authField =
            (socket.handshake.auth?.token as string | undefined) ||
            (socket.handshake.headers?.authorization as string | undefined);

        const bearerToken = authField?.startsWith("Bearer ")
            ? authField.split(" ")[1]
            : undefined;

        const cookieToken: string | undefined = (
            socket.handshake.headers?.cookie ?? ""
        )
            .split(";")
            .find((c) => c.trim().startsWith("jwt="))
            ?.split("=")[1];

        const token = bearerToken ?? cookieToken;

        if (!token) {
            return next(new Error("AUTH_REQUIRED"));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!);

        if (typeof decoded !== "object" || decoded === null) {
            return next(new Error("INVALID_TOKEN"));
        }

        const parsed = authPayloadSchema.safeParse(decoded);
        if (!parsed.success) {
            return next(new Error("INVALID_TOKEN"));
        }

        socket.userId = Number(parsed.data.sub);
        socket.userFullName =
            (parsed.data as { fullName?: string }).fullName ?? "User";

        next();
    } catch {
        next(new Error("TOKEN_EXPIRED_OR_INVALID"));
    }
}
