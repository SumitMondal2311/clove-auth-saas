import { Prisma, prisma } from "../index.js";

export const findSession = (sessionId: string) => {
    return prisma.session.findUnique({
        where: {
            revoked: false,
            id: sessionId,
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
