import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../../src/app.js";
import { getUUID } from "../../../src/utils/crypto.js";
import { signToken } from "../../../src/utils/token.js";
import { createLoggedInUser } from "../../helpers/create-logged-in-user.js";

describe("Refresh Token Endpoint", () => {
    const pathname = "/api/auth/refresh-token";
    const testUA = "vitest";
    const testIP = "127.0.0.1";
    const testPassword = "Test@clove123";
    const testEmail = "refresh-token@clove.com";
    let refreshToken: string;

    beforeAll(async () => {
        const result = await createLoggedInUser({
            ipAddress: testIP,
            userAgent: testUA,
            email: testEmail,
            password: testPassword,
        });

        refreshToken = result.refreshToken;
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should not allow without refresh token inside cookie", async () => {
        const res = await request(app).post(pathname).send();

        expect(res.statusCode).toBe(401);
    });

    it("should not allow invalid refresh token", async () => {
        const res = await request(app)
            .post(pathname)
            .set("Authorization", "Bearer invalid_token")
            .set("Cookie", "__refresh_token__=invalid_token")
            .send();

        expect(res.statusCode).toBe(401);
    });

    it("should not allow invalid refresh token type", async () => {
        const token = signToken(
            {
                session_id: getUUID(),
                sub: getUUID(),
                jti: getUUID(),
                type: "access",
            },
            60
        );

        const res = await request(app)
            .post(pathname)
            .set("Cookie", `__refresh_token__=${token}`)
            .send();

        expect(res.statusCode).toBe(403);
    });

    it("should refresh token successfully", async () => {
        const res = await request(app)
            .post(pathname)
            .set("Cookie", `__refresh_token__=${refreshToken}`)
            .send();

        expect(res.headers["set-cookie"]).toBeDefined();
        expect(res.statusCode).toBe(200);
        expect(res.body.accessToken).toBeDefined();
    });
});
