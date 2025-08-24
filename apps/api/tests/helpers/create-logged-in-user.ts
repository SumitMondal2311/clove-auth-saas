import { hash } from "bcryptjs";
import { constant } from "../../src/configs/constant.js";
import { env } from "../../src/configs/env.js";
import { prisma } from "../../src/db/index.js";
import { getUUID } from "../../src/utils/crypto.js";
import { expiresAt } from "../../src/utils/expires-at.js";
import { signToken } from "../../src/utils/token.js";

export const createLoggedInUser = async ({
    ipAddress,
    userAgent,
    email,
    password,
}: {
    ipAddress: string;
    userAgent: string;
    email: string;
    password: string;
}) => {
    const refreshJti = getUUID();
    const userId = getUUID();
    const sessionId = getUUID();
    const refreshToken = signToken(
        {
            type: "refresh",
            sub: userId,
            session_id: sessionId,
            jti: refreshJti,
        },
        env.REFRESH_TOKEN_EXPIRY
    );
    await prisma.$transaction(async (tx) => {
        await tx.user.create({
            data: {
                id: userId,
                lastLoginInfo: {
                    ipAddress,
                    userAgent,
                },
            },
        });
        await tx.email.create({
            data: {
                verified: true,
                email,
                primary: true,
                user: {
                    connect: {
                        id: userId,
                    },
                },
            },
        });
        await tx.account.create({
            data: {
                password: await hash(password, 10),
                providerUserId: email,
                user: {
                    connect: {
                        id: userId,
                    },
                },
            },
        });
        return await tx.session.create({
            data: {
                id: sessionId,
                ipAddress,
                userAgent,
                refreshJti,
                expiresAt: expiresAt(constant.REFRESH_TOKEN_EXPIRY_MS),
                user: {
                    connect: {
                        id: userId,
                    },
                },
            },
        });
    });

    return {
        refreshToken,
        accessToken: signToken(
            {
                type: "access",
                sub: userId,
                session_id: sessionId,
            },
            env.ACCESS_TOKEN_EXPIRY
        ),
    };
};
