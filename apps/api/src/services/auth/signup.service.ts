import { hash } from "bcryptjs";
import { env } from "../../configs/env.js";
import { prisma } from "../../db/index.js";
import { findEmailByAddress } from "../../db/queries/email.query.js";
import { sendVerificationEmail } from "../../emails/service.js";
import { CloveError } from "../../utils/clove-error.js";
import { getToken } from "../../utils/crypto.js";
import { expiresAt } from "../../utils/expires-at.js";

type Status = "EMAIL_UNVERIFIED_RESENT" | "SIGNUP_SUCCESS";

export const signupService = async ({
    ipAddress,
    userAgent,
    email,
    password,
}: {
    ipAddress?: string;
    userAgent?: string;
    email: string;
    password: string;
}): Promise<Status> => {
    let status: Status = "SIGNUP_SUCCESS";
    const emailRecord = await findEmailByAddress(email);

    const verificationToken = await prisma.$transaction(async (tx) => {
        let userId;
        if (emailRecord) {
            if (emailRecord.verified) {
                throw new CloveError(409, {
                    message: "Failed to sign up: email already in use",
                    details: "This email is already registered and verified",
                });
            } else {
                userId = emailRecord.userId;
                status = "EMAIL_UNVERIFIED_RESENT";
            }
        } else {
            const newUser = await tx.user.create({
                data: {
                    lastLoginInfo: {
                        ipAddress,
                        userAgent,
                    },
                },
            });
            userId = newUser.id;
            await tx.email.create({
                data: {
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
            await tx.auditLog.create({
                data: {
                    event: "ACCOUNT_CREATED",
                    ipAddress,
                    userAgent,
                    user: {
                        connect: {
                            id: userId,
                        },
                    },
                },
            });
        }
        await tx.token.deleteMany({
            where: {
                type: "EMAIL_VERIFICATION",
                userId,
            },
        });
        return await tx.token.create({
            data: {
                value: getToken(32),
                type: "EMAIL_VERIFICATION",
                ipAddress,
                userAgent,
                expiresAt: expiresAt(env.EMAIL_VERIFICATION_TOKEN_EXPIRY_MS),
                user: {
                    connect: {
                        id: userId,
                    },
                },
            },
        });
    });

    if (verificationToken) {
        await sendVerificationEmail(email, verificationToken.value);
    }

    return status;
};
