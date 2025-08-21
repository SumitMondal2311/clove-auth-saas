import { NextFunction, Request, Response } from "express";
import { constant } from "../../configs/constant.js";
import { env } from "../../configs/env.js";
import { refreshTokenService } from "../../services/auth/refresh-token.service.js";
import { CloveError } from "../../utils/clove-error.js";
import { signToken } from "../../utils/token.js";

export const refreshTokenController = async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies["__refresh_token__"];
    if (!refreshToken) {
        return next(
            new CloveError(401, {
                message: "Missing refresh token",
                details: "Refresh token missing in the cookies",
            })
        );
    }

    const { userId, newRefreshToken, sessionId } = await refreshTokenService(refreshToken);

    const responseWithCookie = res.cookie("__refresh_token__", newRefreshToken, {
        secure: constant.IS_PRODUCTION,
        httpOnly: true,
        maxAge: env.REFRESH_TOKEN_EXPIRY,
        sameSite: "lax",
    });

    responseWithCookie.status(200).json({
        accessToken: signToken(
            {
                sub: userId,
                session_id: sessionId,
                type: "access",
            },
            constant.ACCESS_TOKEN_EXPIRY_MS
        ),
    });
};
