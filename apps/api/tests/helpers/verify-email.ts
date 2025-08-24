import { prisma } from "../../src/db/index.js";

export const verifyEmail = (email: string) => {
    return prisma.email.update({
        where: {
            email,
        },
        data: {
            verified: true,
        },
    });
};
