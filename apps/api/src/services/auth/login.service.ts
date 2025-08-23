import { compare, hash } from "bcryptjs";
import { constant } from "../../configs/constant.js";
import { env } from "../../configs/env.js";
import { prisma, User } from "../../db/index.js";
import { findLocalAccount } from "../../db/queries/account.query.js";
import { findEmailByAddressIncludeUser } from "../../db/queries/email.query.js";
import { findAllSessionByUserId, revokeSession } from "../../db/queries/session.query.js";
import { sendVerificationEmail } from "../../emails/service.js";
import { CloveError } from "../../utils/clove-error.js";
import { getToken, getUUID } from "../../utils/crypto.js";
import { expiresAt } from "../../utils/expires-at.js";
import { signToken } from "../../utils/token.js";

export const loginService = async ({
    ipAddress,
    userAgent,
    email,
    password,
}: {
    ipAddress?: string;
    userAgent?: string;
    email: string;
    password: string;
}): Promise<
    | {
          status: "EMAIL_VERIFICATION_REQUIRED";
      }
    | {
          refreshToken: string;
          user: User & {
              email: string;
          };
          sessionId: string;
          status: "LOGIN_SUCCESS";
      }
> => {
    const emailRecord = await findEmailByAddressIncludeUser(email);
    if (!emailRecord) {
        throw new CloveError(401, {
            message: "Failed to log in: Invalid credentials",
            details: "Provided email is either incorrect or did not exist",
        });
    }

    const { user } = emailRecord;
    const tokenSecret = getToken(32);

    if (!emailRecord.verified) {
        const verificationToken = await prisma.$transaction(async (tx) => {
            await tx.token.deleteMany({
                where: {
                    userId: user.id,
                    type: "EMAIL_VERIFICATION",
                },
            });
            return await tx.token.create({
                data: {
                    type: "EMAIL_VERIFICATION",
                    secret: await hash(tokenSecret, 10),
                    email,
                    ipAddress,
                    userAgent,
                    expiresAt: expiresAt(env.EMAIL_VERIFICATION_TOKEN_EXPIRY_MS),
                    user: {
                        connect: {
                            id: user.id,
                        },
                    },
                },
            });
        });

        if (verificationToken) {
            await sendVerificationEmail(email, `${verificationToken.id}.${tokenSecret}`);
        }

        return {
            status: "EMAIL_VERIFICATION_REQUIRED",
        };
    }

    const account = await findLocalAccount(email);
    if (!account) {
        throw new CloveError(404, {
            message: "Failed to log in: Account not found",
            details: "No account found linked with this email",
        });
    }

    const passwordMatched = await compare(password, account.password || "password");
    if (!passwordMatched) {
        throw new CloveError(401, {
            message: "Failed to log in: Invalid credentials",
            details: "Incorrect password",
        });
    }

    const sessions = await findAllSessionByUserId(user.id, {
        lastActiveAt: "asc",
    });
    if (sessions.length >= env.SESSION_LIMIT) {
        await revokeSession(sessions[0].id);
    }

    const refreshJti = getUUID();
    const sessionId = getUUID();
    const refreshToken = signToken(
        {
            sub: user.id,
            session_id: sessionId,
            type: "refresh",
            jti: refreshJti,
        },
        env.REFRESH_TOKEN_EXPIRY
    );

    await prisma.$transaction(async (tx) => {
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
                event: "LOGGED_INTO_ACCOUNT",
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
        refreshToken,
        user: {
            ...user,
            email,
        },
        sessionId,
        status: "LOGIN_SUCCESS",
    };
};
