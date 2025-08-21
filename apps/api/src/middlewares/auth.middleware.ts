import { NextFunction, Request, Response } from "express";
import { findSession, updateLastActiveAt } from "../db/queries/session.query.js";
import { findUserIncludeEmail } from "../db/queries/user.query.js";
import { CloveError } from "../utils/clove-error.js";
import { verifyToken } from "../utils/token.js";

export const authMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return next(
            new CloveError(401, {
                message: "Missing auth header",
                details: "Authorization header not provided",
            })
        );
    }

    const [schema, accessToken] = authHeader.split(" ");
    if (schema !== "Bearer" || !accessToken) {
        return next(
            new CloveError(400, {
                message: "Invalid or malformed auth header",
                details: "Expected format: Bearer <accessToken>",
            })
        );
    }

    const { sub, session_id, type } = await verifyToken(accessToken);
    if (type !== "access") {
        return next(
            new CloveError(401, {
                message: "Invalid token type",
                details: "Token type expected: access",
            })
        );
    }

    const session = await findSession(session_id || "sessionId");
    if (!session) {
        return next(
            new CloveError(404, {
                message: "Session not found",
                details: "No active session found",
            })
        );
    }

    const userIncludeEmails = await findUserIncludeEmail(sub || "userId");
    if (!userIncludeEmails) {
        return next(
            new CloveError(404, {
                message: "User not found",
                details: "No user associated with the token",
            })
        );
    }

    // update at a minimum time-gap of 5 mins
    if (Date.now() - session.lastActiveAt.getTime() > 300 * 1000) {
        await updateLastActiveAt(session_id || "sessionId");
    }

    req.authData = {
        user: userIncludeEmails,
        sessionId: session_id,
    };

    next();
};
