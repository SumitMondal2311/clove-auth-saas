import { prisma } from "../index.js";

export const findEmailByAddressIncludeUser = (email: string) => {
    return prisma.email.findUnique({
        where: {
            email,
        },
        include: {
            user: true,
        },
    });
};

export const findEmailByAddress = (email: string) => {
    return prisma.email.findUnique({
        where: {
            email,
        },
    });
};
