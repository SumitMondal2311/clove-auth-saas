import { env } from "../../configs/env.js";
import { redis } from "../../configs/redis.js";
import { findSession, rotateRefreshToken } from "../../db/queries/session.query.js";
import { CloveError } from "../../utils/clove-error.js";
import { getUUID } from "../../utils/crypto.js";
import { redisKey } from "../../utils/redis-key.js";
import { signToken, verifyToken } from "../../utils/token.js";

export const refreshTokenService = async (
    refreshToken: string
): Promise<{
    newRefreshToken: string;
    userId: string;
    sessionId: string;
}> => {
    const { sub, jti, exp, session_id, type } = await verifyToken(refreshToken);
    if (type !== "refresh") {
        throw new CloveError(403, {
            message: "Invalid token type",
            details: "Token type expected: refresh",
        });
    }

    const session = await findSession(session_id || "");
    if (!session) {
        throw new CloveError(404, {
            message: "Session not found",
            details: "No active session found",
        });
    }

    if (jti !== session.refreshJti) {
        throw new CloveError(403, {
            message: "Warning: Token tampered",
            details: "This refresh token id does not match with the store refresh token id",
        });
    }

    if (await redis.get(redisKey.blacklistJti(jti))) {
        throw new CloveError(403, {
            message: "Warning: Attempt blacklisted token re-use",
            details: "Provided refresh token is already revoked",
        });
    }

    const refreshJti = getUUID();
    const newRefreshToken = signToken(
        {
            type: "refresh",
            sub,
            session_id: session.id,
            jti: refreshJti,
        },
        env.REFRESH_TOKEN_EXPIRY
    );

    await rotateRefreshToken({
        refreshJti,
        sessionId: session.id,
    });

    await redis.set(
        redisKey.blacklistJti(jti || ""),
        "revoked",
        "EX",
        Math.ceil(exp ? Math.max(0, exp - Date.now() / 1000) : env.REFRESH_TOKEN_EXPIRY)
    );

    return {
        sessionId: session.id,
        newRefreshToken,
        userId: session.userId,
    };
};
