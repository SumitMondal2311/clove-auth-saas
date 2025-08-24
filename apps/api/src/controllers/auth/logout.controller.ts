import { NextFunction, Request, Response } from "express";
import { logoutService } from "../../services/auth/logout.service.js";
import { CloveError } from "../../utils/clove-error.js";
import { normalizedIP } from "../../utils/normalized-ip.js";

export const logoutController = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies["__refresh_token__"];
    if (!refreshToken) {
        return next(
            new CloveError(401, {
                message: "Failed to log out: Missing refresh token",
                details: "Refresh token is missing from the cookie",
            })
        );
    }

    await logoutService({
        userAgent: req.headers["user-agent"],
        ipAddress: normalizedIP(req.ip || "unknown"),
        refreshToken,
    });

    res.cookie("__refresh_token__", "", {
        maxAge: 0,
    });

    res.status(200).json({ message: "Logged out successfully" });
};
