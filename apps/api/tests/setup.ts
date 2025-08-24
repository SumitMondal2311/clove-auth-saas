import { beforeAll, vi } from "vitest";
import { redis } from "../src/configs/redis.js";
import { prisma } from "../src/db/index.js";
import { mockSendVerificationEmail } from "./__mocks__/email-service.js";

beforeAll(async () => {
    await prisma.user.deleteMany();
    await prisma.account.deleteMany();
    await prisma.email.deleteMany();
    await prisma.auditLog.deleteMany();
    await prisma.token.deleteMany();
    await prisma.session.deleteMany();

    await redis.flushall();
});

vi.mock("@src/emails/service.js", () => ({
    sendVerificationEmail: mockSendVerificationEmail,
}));
