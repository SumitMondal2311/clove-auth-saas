import { Request, Response, Router } from "express";

export const router = Router();

router.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
        uptime: process.uptime(),
        message: "OK",
    });
});
