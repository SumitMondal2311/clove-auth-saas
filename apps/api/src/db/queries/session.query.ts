import { prisma } from "../index.js";

export const findAllSessionByAsc = (userId: string) => {
    return prisma.session.findMany({
        where: {
            userId,
            revoked: false,
        },
        orderBy: {
            lastActiveAt: "asc",
        },
        select: {
            id: true,
            createdAt: true,
        },
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
