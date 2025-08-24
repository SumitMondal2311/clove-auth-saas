import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { app } from "../../../src/app.js";
import { getToken, getUUID } from "../../../src/utils/crypto.js";
import { createUser } from "../../helpers/create-user.js";

describe("Verify Email Endpoint", () => {
    const tokenSecret = getToken(32);
    let tokenId: string;
    const pathname = "/api/auth/verify-email";
    const testUA = "vitest";
    const testIP = "127.0.0.1";
    const testEmail = "verifyemail@clove.com";
    const testPassword = "Test@clove123";

    beforeAll(async () => {
        tokenId = await createUser({
            ipAddress: testIP,
            userAgent: testUA,
            tokenSecret,
            email: testEmail,
            password: testPassword,
        });
    });

    it("should not allow without token query parameter", async () => {
        const res = await request(app).post(pathname).send();

        expect(res.statusCode).toBe(403);
    });

    it("should not allow invalid token format", async () => {
        const res = await request(app)
            .post(pathname)
            .query({
                token: "abc123",
            })
            .send();

        expect(res.statusCode).toBe(400);
    });

    it("should not allow invalid token Id", async () => {
        const res = await request(app)
            .post(pathname)
            .query({
                token: "abc.123",
            })
            .send();

        expect(res.statusCode).toBe(403);
    });

    it("should not allow invalid token", async () => {
        const res = await request(app)
            .post(pathname)
            .query({
                token: `${getUUID()}.${tokenSecret}`,
            })
            .send();

        expect(res.statusCode).toBe(404);
    });

    it("should not allow invalid secret", async () => {
        const res = await request(app)
            .post(pathname)
            .query({
                token: `${tokenId}.${getToken(32)}`,
            })
            .send();

        expect(res.statusCode).toBe(401);
    });

    it("should verify the email and log in a user", async () => {
        const res = await request(app)
            .post(pathname)
            .query({
                token: `${tokenId}.${tokenSecret}`,
            })
            .send();

        expect(res.body.user.email).toBe(testEmail);
        expect(res.body.accessToken).toBeDefined();
        expect(res.statusCode).toBe(200);
        expect(res.headers["set-cookie"]).toBeDefined();
    });
});
