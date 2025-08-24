import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../../src/app.js";
import { verifyToken } from "../../../src/utils/token.js";
import { mockSendVerificationEmail } from "../../__mocks__/email-service.js";
import { createUser } from "../../helpers/create-user.js";
import { verifyEmail } from "../../helpers/verify-email.js";

describe("Login Endpoint", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const pathname = "/api/auth/login";
    const testUA = "vitest";
    const testIP = "127.0.0.1";
    const testPassword = "Test@clove123";
    const testEmail = "login@clove.com";

    it("should not allow invalid email", async () => {
        const res = await request(app).post(pathname).send({
            email: "test",
            password: testPassword,
        });

        expect(res.statusCode).toBe(400);
    });

    it("should not allow invalid password", async () => {
        const res = await request(app).post(pathname).send({
            email: testEmail,
            password: "",
        });

        expect(res.statusCode).toBe(400);
    });

    beforeAll(async () => {
        await createUser({
            ipAddress: testIP,
            userAgent: testUA,
            email: testEmail,
            password: testPassword,
        });
    });

    it("should resent verification email if email is not verified", async () => {
        const res = await request(app).post(pathname).send({
            email: testEmail,
            password: testPassword,
        });

        expect(mockSendVerificationEmail).toHaveBeenCalledWith(testEmail, expect.any(String));

        expect(res.statusCode).toBe(200);
    });

    it("should login a user successfully", async () => {
        await verifyEmail(testEmail);

        const res = await request(app)
            .post(pathname)
            .set("user-agent", testUA)
            .set("ip", testIP)
            .send({
                email: testEmail,
                password: testPassword,
            });

        const decoded = await verifyToken(res.body.accessToken);

        expect(res.body.user.email).toBe(testEmail);
        expect(decoded.sub).toBe(res.body.user.id);
        expect(res.statusCode).toBe(200);
        expect(res.headers["set-cookie"]).toBeDefined();
    });
});
