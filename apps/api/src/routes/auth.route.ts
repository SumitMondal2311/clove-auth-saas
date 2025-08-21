import { Router } from "express";
import { loginController, logoutController, signupController } from "../controllers/auth/index.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { handleAsync } from "../utils/handle-async.js";

export const authRouter = Router();

authRouter.post("/signup", handleAsync(signupController));
authRouter.post("/login", handleAsync(loginController));
authRouter.post("/logout", handleAsync(authMiddleware), handleAsync(logoutController));
