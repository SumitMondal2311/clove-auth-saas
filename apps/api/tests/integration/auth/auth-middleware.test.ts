import { Request, Response } from "express";
import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../../../src/app.js";
import { env } from "../../../src/configs/env.js";
import { authMiddleware } from "../../../src/middlewares/auth.middleware.js";
import { getUUID } from "../../../src/utils/crypto.js";
import { handleAsync } from "../../../src/utils/handle-async.js";
import { signToken } from "../../../src/utils/token.js";
import { createLoggedInUser } from "../../helpers/create-logged-in-user.js";

describe("Auth Middleware", () => {
    const pathname = "/api/protected";
    const testUA = "vitest";
    const testIP = "127.0.0.1";
    const testPassword = "Test@clove123";
    const testEmail = "auth-middleware@clove.com";
    let accessToken: string;

    beforeAll(async () => {
        const result = await createLoggedInUser({
            ipAddress: testIP,
            userAgent: testUA,
            email: testEmail,
            password: testPassword,
        });

        accessToken = result.accessToken;
    });

    app.get(pathname, handleAsync(authMiddleware), (req: Request, res: Response) => {
        res.status(200).json({
            user: req.authData?.user,
        });
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should not allow without token query parameter", async () => {
        const res = await request(app).get(pathname).send();

        expect(res.statusCode).toBe(401);
    });

    it("should not allow invalid token format", async () => {
        const res = await request(app).get(pathname).set("Authorization", "invalid_format").send();

        expect(res.statusCode).toBe(400);
    });

    it("should not allow invalid token", async () => {
        const res = await request(app)
            .get(pathname)
            .set("Authorization", "Bearer invalid_token")
            .send();

        expect(res.statusCode).toBe(401);
    });

    it("should not allow invalid token type", async () => {
        const token = signToken(
            {
                session_id: getUUID(),
                sub: getUUID(),
                type: "refresh",
            },
            60
        );

        const res = await request(app).get(pathname).set("Authorization", `Bearer ${token}`).send();

        expect(res.statusCode).toBe(401);
    });

    it("should allow access to the protected route", async () => {
        const res = await request(app)
            .get(pathname)
            .set("Authorization", `Bearer ${accessToken}`)
            .send();

        expect(res.body.user.emails).toEqual(
            expect.arrayContaining([expect.objectContaining({ email: testEmail })])
        );
        expect(res.statusCode).toBe(200);
    });
});
