import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../../src/app.js";
import { getUUID } from "../../../src/utils/crypto.js";
import { signToken } from "../../../src/utils/token.js";
import { createLoggedInUser } from "../../helpers/create-logged-in-user.js";

describe("Logout Endpoint", () => {
    const pathname = "/api/auth/logout";
    const testUA = "vitest";
    const testIP = "127.0.0.1";
    const testPassword = "Test@clove123";
    const testEmail = "logout@clove.com";
    let accessToken: string;
    let refreshToken: string;

    beforeAll(async () => {
        const result = await createLoggedInUser({
            ipAddress: testIP,
            userAgent: testUA,
            email: testEmail,
            password: testPassword,
        });

        refreshToken = result.refreshToken;
        accessToken = result.accessToken;
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should not allow without access token query parameter", async () => {
        const res = await request(app).post(pathname).send();

        expect(res.statusCode).toBe(401);
    });

    it("should not allow without refresh token inside cookie", async () => {
        const res = await request(app)
            .post(pathname)
            .set("Authorization", `Bearer ${accessToken}`)
            .send();

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
            .set("Authorization", `Bearer ${accessToken}`)
            .set("Cookie", `__refresh_token__=${token}`)
            .send();

        expect(res.statusCode).toBe(401);
    });

    it("should logout a user successfully", async () => {
        const res = await request(app)
            .post(pathname)
            .set("Authorization", `Bearer ${accessToken}`)
            .set("Cookie", `__refresh_token__=${refreshToken}`)
            .send();

        expect(res.headers["set-cookie"]).toEqual(
            expect.arrayContaining([expect.stringMatching("__refresh_token__=; Max-Age=0;")])
        );
        expect(res.statusCode).toBe(200);
    });
});
