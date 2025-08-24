import { hash } from "bcryptjs";
import { env } from "../../src/configs/env.js";
import { prisma } from "../../src/db/index.js";
import { expiresAt } from "../../src/utils/expires-at.js";

export const createUser = async ({
    ipAddress,
    userAgent,
    tokenSecret,
    email,
    password,
}: {
    ipAddress: string;
    userAgent: string;
    tokenSecret?: string;
    email: string;
    password: string;
}): Promise<string> => {
    const token = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: {
                lastLoginInfo: {
                    ipAddress,
                    userAgent,
                },
            },
        });
        await tx.email.create({
            data: {
                email,
                primary: true,
                user: {
                    connect: {
                        id: newUser.id,
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
                        id: newUser.id,
                    },
                },
            },
        });
        return await tx.token.create({
            data: {
                type: "EMAIL_VERIFICATION",
                secret: await hash(tokenSecret || "secret", 10),
                email,
                ipAddress,
                userAgent,
                expiresAt: expiresAt(env.EMAIL_VERIFICATION_TOKEN_EXPIRY_MS),
                user: {
                    connect: {
                        id: newUser.id,
                    },
                },
            },
        });
    });

    return token.id;
};
