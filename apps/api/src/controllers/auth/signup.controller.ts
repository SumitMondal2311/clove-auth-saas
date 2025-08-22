import { NextFunction, Request, Response } from "express";
import { authSchema } from "../../configs/validator.js";
import { signupService } from "../../services/auth/signup.service.js";
import { CloveError } from "../../utils/clove-error.js";
import { normalizedIP } from "../../utils/normalized-ip.js";

export const signupController = async (req: Request, res: Response, next: NextFunction) => {
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
    const status = await signupService({
        userAgent: req.headers["user-agent"],
        ipAddress: normalizedIP(req.ip || "unknown"),
        email,
        password,
    });

    if (status === "EMAIL_UNVERIFIED_RESENT") {
        return res.status(200).json({
            message: "Verification email resent",
        });
    }

    res.status(201).json({
        message: "Signed up successfully, please verify you email",
    });
};
