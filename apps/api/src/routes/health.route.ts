import { Request, Response } from "express";
import { prisma } from "../db/index.js";

export const health = async (_req: Request, res: Response) => {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
        uptime: process.uptime(),
        message: "OK",
    });
};
