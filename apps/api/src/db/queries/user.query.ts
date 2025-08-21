import { prisma } from "../index.js";

export const findUserIncludeEmail = (userId: string) => {
    return prisma.user.findUnique({
        where: {
            id: userId,
        },
        include: {
            emailAddresses: {
                select: {
                    email: true,
                },
            },
        },
    });
};
