import { NextFunction, Request, Response } from "express";
import { constant } from "../../configs/constant.js";
import { env } from "../../configs/env.js";
import { verifyEmaiService } from "../../services/auth/verify-email.service.js";
import { CloveError } from "../../utils/clove-error.js";
import { signToken } from "../../utils/token.js";

export const verifyEmailController = async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.query;
    if (!token) {
        return next(
            new CloveError(403, {
                message: "Token is missing",
                details: "Token query parameter not provided",
            })
        );
    }

    if (typeof token !== "string") {
        return next(
            new CloveError(403, {
                message: "Invalid token type",
                details: "Token type expected: string",
            })
        );
    }

    const { refreshToken, user, sessionId } = await verifyEmaiService({
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        token: decodeURIComponent(token),
    });

    const responseWithCookie = res.cookie("__refresh_token__", refreshToken, {
        secure: constant.IS_PRODUCTION,
        httpOnly: true,
        maxAge: constant.REFRESH_TOKEN_EXPIRY_MS,
        sameSite: "strict",
    });

    responseWithCookie.status(200).json({
        user,
        accessToken: signToken(
            {
                type: "access",
                session_id: sessionId,
                sub: user.id,
            },
            env.ACCESS_TOKEN_EXPIRY
        ),
        message: "Email verified successfully",
    });
};
