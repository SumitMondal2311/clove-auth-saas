import { Router } from "express";
import { healthController } from "../controllers/health.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { handleAsync } from "../utils/handle-async.js";

export const healthRouter = Router();

healthRouter.get("/", handleAsync(healthController));
healthRouter.get("/protected", handleAsync(authMiddleware), handleAsync(healthController));
