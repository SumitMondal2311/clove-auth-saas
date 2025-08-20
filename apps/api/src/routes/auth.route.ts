import { Router } from "express";
import { loginController } from "../controllers/auth/login.controller.js";
import { signupController } from "../controllers/auth/signup.controller.js";
import { handleAsync } from "../utils/handle-async.js";

export const authRouter = Router();

authRouter.post("/signup", handleAsync(signupController));
authRouter.post("/login", handleAsync(loginController));
