import { constant } from "../../configs/constant.js";
import { expiresAt } from "../../utils/expires-at.js";
import { LoginMethod, Prisma, prisma } from "../index.js";

export const findSession = (sessionId: string, loginMethod: LoginMethod = "EMAIL") => {
    return prisma.session.findUnique({
        where: {
            revoked: false,
            id: sessionId,
            loginMethod,
        },
    });
};

export const findAllSessionByUserId = (
    userId: string,
    orderBy: Prisma.SessionOrderByWithAggregationInput
) => {
    return prisma.session.findMany({
        where: {
            revoked: false,
            userId,
        },
        orderBy,
    });
};

export const revokeSession = (sessionId: string) => {
    return prisma.session.update({
        where: {
            id: sessionId,
        },
        data: {
            revokedAt: new Date(),
            revoked: true,
        },
    });
};

export const updateLastActiveAt = (sessionId: string) => {
    return prisma.session.update({
        where: {
            id: sessionId,
        },
        data: {
            lastActiveAt: new Date(),
            revoked: false,
        },
    });
};

export const rotateRefreshToken = ({
    refreshJti,
    sessionId,
    loginMethod = "EMAIL",
}: {
    refreshJti: string;
    sessionId: string;
    loginMethod?: LoginMethod;
}) => {
    return prisma.session.update({
        where: {
            id: sessionId,
            revoked: false,
            loginMethod,
        },
        data: {
            refreshJti,
            expiresAt: expiresAt(constant.REFRESH_TOKEN_EXPIRY_MS),
            lastRotateAt: new Date(),
        },
    });
};
