import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../../src/app.js";
import { mockSendVerificationEmail } from "../../__mocks__/email-service.js";

describe("Signup Endpoint", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const pathname = "/api/auth/signup";
    const testUA = "vitest";
    const testIP = "127.0.0.1";
    const testEmail = "signup@clove.com";
    const testPassword = "Test@clove123";

    it("should not allow invalid email", async () => {
        const res = await request(app).post(pathname).send({
            email: "test@test",
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

    it("should signup a new user and send verification email", async () => {
        const res = await request(app)
            .post(pathname)
            .set("ip", testIP)
            .set("user-agent", testUA)
            .send({
                email: testEmail,
                password: testPassword,
            });

        expect(mockSendVerificationEmail).toHaveBeenCalledWith(testEmail, expect.any(String));

        expect(res.statusCode).toBe(201);
    });

    it("should resent verification email if same user already exists", async () => {
        const res = await request(app)
            .post(pathname)
            .set("ip", testIP)
            .set("user-agent", testUA)
            .send({
                email: testEmail,
                password: testPassword,
            });

        expect(mockSendVerificationEmail).toHaveBeenCalledWith(testEmail, expect.any(String));

        expect(res.statusCode).toBe(200);
    });
});
