import { prisma } from "../index.js";

export const findLocalAccount = (email: string) => {
    return prisma.account.findUnique({
        where: {
            provider_providerUserId: {
                provider: "LOCAL",
                providerUserId: email,
            },
        },
    });
};
