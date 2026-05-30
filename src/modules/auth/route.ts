import { Router } from "express";
import {
    login,
    signup,
    getCurrentUser,
    googleAuth,
    logout,
    resetPassword,
} from "./controller.js";
import { authenticateToken } from "../../core/middleware/auth.middleware.js";
import { validate } from "../../core/middleware/validate.js";
import {
    loginBodySchema,
    signupBodySchema,
    resetPasswordSchema,
} from "../../core/validators/user.validators.js";

const authRoute = Router();

authRoute.post("/login", validate(loginBodySchema, "body"), login);
authRoute.post("/signup", validate(signupBodySchema, "body"), signup);
authRoute.post("/google", googleAuth);
authRoute.post("/logout", logout);
authRoute.post("/reset-password", validate(resetPasswordSchema, "body"), resetPassword);

authRoute.get("/me", authenticateToken, getCurrentUser);

export default authRoute;
