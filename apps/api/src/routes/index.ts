import { Router } from "express";
import { handleAsync } from "../utils/handle-async";
import { health } from "./health.route.js";

export const router = Router();

router.get("/health", handleAsync(health));
