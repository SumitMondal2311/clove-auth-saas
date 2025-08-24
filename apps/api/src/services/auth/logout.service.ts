import { env } from "../../configs/env.js";
import { redis } from "../../configs/redis.js";
import { prisma } from "../../db/index.js";
import { findSessionByUserId_Jti } from "../../db/queries/session.query.js";
import { CloveError } from "../../utils/clove-error.js";
import { redisKey } from "../../utils/redis-key.js";
import { verifyToken } from "../../utils/token.js";

export const logoutService = async ({
    refreshToken,
    ipAddress,
    userAgent,
}: {
    refreshToken: string;
    ipAddress?: string;
    userAgent?: string;
}) => {
    const { sub, jti, exp, session_id, type } = await verifyToken(refreshToken);
    if (type !== "refresh") {
        throw new CloveError(401, {
            message: "Failed to log out: Invalid token type",
            details: "Token type expected: refresh",
        });
    }

    const session = await findSessionByUserId_Jti(sub || "", jti || "");
    if (!session) {
        throw new CloveError(404, {
            message: "Failed to log out: Session not found",
            details: "Refresh jti is not associated with the user",
        });
    }

    await prisma.$transaction(async (tx) => {
        await tx.session.update({
            where: {
                revoked: false,
                id: session_id,
                userId: sub,
            },
            data: {
                revoked: true,
                revokedAt: new Date(),
            },
        });
        await tx.auditLog.create({
            data: {
                event: "LOGGED_OUT",
                ipAddress,
                userAgent,
                user: {
                    connect: {
                        id: sub,
                    },
                },
            },
        });
    });

    await redis.set(
        redisKey.blacklistJti(jti || ""),
        "revoked",
        "EX",
        Math.ceil(exp ? Math.max(0, exp - Date.now() / 1000) : env.REFRESH_TOKEN_EXPIRY)
    );
};
