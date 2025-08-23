import { prisma } from "../index.js";

export const findToken = (id: string, secret: string) => {
    return prisma.token.findUnique({
        where: {
            id,
        },
    });
};
