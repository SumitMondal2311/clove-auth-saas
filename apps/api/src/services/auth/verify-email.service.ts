import { compare } from "bcryptjs";
import { constant } from "../../configs/constant.js";
import { env } from "../../configs/env.js";
import { prisma, User } from "../../db/index.js";
import { findEmailByAddressIncludeUser } from "../../db/queries/email.query.js";
import { findToken } from "../../db/queries/token.query.js";
import { CloveError } from "../../utils/clove-error.js";
import { getUUID } from "../../utils/crypto.js";
import { expiresAt } from "../../utils/expires-at.js";
import { signToken } from "../../utils/token.js";

export const verifyEmaiService = async ({
    ipAddress,
    userAgent,
    secret,
    tokenId,
}: {
    ipAddress?: string;
    userAgent?: string;
    secret: string;
    tokenId: string;
}): Promise<{
    refreshToken: string;
    user: User & {
        email: string;
    };
    sessionId: string;
}> => {
    const tokenRecord = await findToken(tokenId);
    if (!tokenRecord) {
        throw new CloveError(404, {
            message: "Failed to verify email: Token not found",
            details: "No token found in the database",
        });
    }

    const secretMatched = await compare(secret, tokenRecord.secret);
    if (!secretMatched) {
        throw new CloveError(401, {
            message: "Failed to verify email: Invalid secret",
            details: "Secret does not match",
        });
    }

    const emailRecord = await findEmailByAddressIncludeUser(tokenRecord.email);
    if (!emailRecord) {
        throw new CloveError(404, {
            message: "Failed verify email: Email not found",
            details: "No email found associated with the token",
        });
    }

    const { user } = emailRecord;

    if (emailRecord.verified) {
        throw new CloveError(403, {
            message: "Failed verify email: Already verified",
            details: "This email is already verified",
        });
    }

    if (tokenRecord.userId !== user.id) {
        throw new CloveError(404, {
            message: "Failed verify email: Token does not belongs to this user",
            details: "Token-User mismatch",
        });
    }

    if (tokenRecord.expiresAt <= new Date()) {
        throw new CloveError(401, {
            message: "Failed to verify email: Token has expired",
            details: "Provided token has expired",
        });
    }

    const refreshJti = getUUID();
    const sessionId = getUUID();
    const refreshToken = signToken(
        {
            jti: refreshJti,
            sub: user.id,
            type: "refresh",
            session_id: sessionId,
        },
        env.REFRESH_TOKEN_EXPIRY
    );

    await prisma.$transaction(async (tx) => {
        await tx.token.deleteMany({
            where: {
                type: "EMAIL_VERIFICATION",
                expiresAt: { lt: new Date() },
                userId: user.id,
            },
        });
        await tx.token.delete({
            where: {
                id: tokenRecord.id,
            },
        });
        await tx.email.update({
            where: {
                id: emailRecord.id,
            },
            data: {
                verified: true,
            },
        });
        await tx.user.update({
            data: {
                lastLoginInfo: {
                    ipAddress,
                    userAgent,
                },
            },
            where: {
                id: user.id,
            },
        });
        await tx.session.create({
            data: {
                id: sessionId,
                expiresAt: expiresAt(constant.REFRESH_TOKEN_EXPIRY_MS),
                ipAddress,
                userAgent,
                refreshJti,
                user: {
                    connect: {
                        id: user.id,
                    },
                },
            },
        });
        await tx.auditLog.create({
            data: {
                event: "EMAIL_VERIFIED",
                ipAddress,
                userAgent,
                user: {
                    connect: {
                        id: user.id,
                    },
                },
            },
        });
    });

    return {
        sessionId,
        user: {
            ...user,
            email: emailRecord.email,
        },
        refreshToken,
    };
};
