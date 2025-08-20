import { NextFunction, Request, Response } from "express";
import { constant } from "../../configs/constant.js";
import { env } from "../../configs/env.js";
import { authSchema } from "../../configs/validator.js";
import { loginService } from "../../services/auth/login.service.js";
import { CloveError } from "../../utils/clove-error.js";
import { normalizedIP } from "../../utils/normalized-ip.js";
import { signToken } from "../../utils/token.js";

export const loginController = async (req: Request, res: Response, next: NextFunction) => {
    const parsedSchema = authSchema.safeParse(req.body);
    if (!parsedSchema.success) {
        const issue = parsedSchema.error.issues[0];
        return next(
            new CloveError(400, {
                message: issue.message,
                details: "Invalid input type",
                metadata: {
                    path: issue.path,
                    input: issue.input,
                    code: issue.code,
                },
            })
        );
    }

    const { email, password } = parsedSchema.data;
    const serviceResult = await loginService({
        userAgent: req.headers["user-agent"],
        ipAddress: normalizedIP(req.ip || "unknown"),
        email,
        password,
    });

    if (serviceResult.status === "EMAIL_VERIFICATION_REQUIRED") {
        const { verificationToken } = serviceResult;
        return res.status(200).json({
            verificationToken,
            message: "Verification email resent",
        });
    }

    const { refreshToken, user, sessionId } = serviceResult;

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
        message: "Logged in successfully",
    });
};
