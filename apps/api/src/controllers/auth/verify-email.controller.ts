import { NextFunction, Request, Response } from "express";
import { constant } from "../../configs/constant.js";
import { env } from "../../configs/env.js";
import { verifyEmaiService } from "../../services/auth/verify-email.service.js";
import { CloveError } from "../../utils/clove-error.js";
import { normalizedIP } from "../../utils/normalized-ip.js";
import { signToken } from "../../utils/token.js";
import { validateUUID } from "../../utils/validate-uuid.js";

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

    const decodedToken = decodeURIComponent(token);
    const [tokenId, secret] = decodedToken.split(".");
    if (!tokenId || !secret) {
        throw new CloveError(400, {
            message: "Failed to verify email: Invalid token format",
            details: "Expected token format: <tokenId>.<secret>",
        });
    }

    if (validateUUID(tokenId) === false) {
        throw new CloveError(403, {
            message: "Invalid token Id",
            details: "Token Id type expected: UUID",
        });
    }

    const { refreshToken, user, sessionId } = await verifyEmaiService({
        userAgent: req.headers["user-agent"],
        ipAddress: normalizedIP(req.ip || "unknown"),
        secret,
        tokenId,
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
