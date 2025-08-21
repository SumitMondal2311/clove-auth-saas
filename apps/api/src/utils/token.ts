import { existsSync, readFileSync } from "fs";
import jwt from "jsonwebtoken";
import { resolve } from "path";
import { env } from "../configs/env.js";
import { findSession } from "../db/queries/session.query.js";
import { AuthPayload } from "../types/auth-payload.js";
import { CloveError } from "./clove-error.js";
import { getUUID } from "./crypto.js";

const secretsDir = resolve(process.cwd(), "secrets");
if (existsSync(secretsDir) === false) {
    console.error("Missing secrets directory");
    process.exit(1);
}

const privateKey = readFileSync(resolve(secretsDir, "private.pem"), "utf8");
if (!privateKey) {
    console.error("Missing private key");
    process.exit(1);
}

export const signToken = (
    payload: AuthPayload,
    expiresIn: jwt.SignOptions["expiresIn"]
): string => {
    payload = {
        ...payload,
        iss: env.JWT_ISS,
        jti: getUUID(),
        kid: env.JWT_KID,
    } as AuthPayload;
    return jwt.sign(payload, privateKey, {
        expiresIn,
        algorithm: "RS256",
    });
};

const publicKey = readFileSync(resolve(secretsDir, "public.pem"), "utf8");
if (!publicKey) {
    console.error("Missing public key");
    process.exit(1);
}

export const verifyToken = async (token: string): Promise<AuthPayload> => {
    try {
        const payload = jwt.verify(token, publicKey, {
            algorithms: ["RS256"],
            issuer: env.JWT_ISS,
        }) as AuthPayload;

        const session = await findSession(payload.session_id || "sessionId");
        if (!session) {
            throw new CloveError(404, {
                message: "Session not found",
                details: "No session found with the payload session id",
            });
        }

        return payload;
    } catch (error) {
        if (
            error instanceof jwt.TokenExpiredError ||
            error instanceof jwt.NotBeforeError ||
            error instanceof jwt.JsonWebTokenError
        ) {
            throw new CloveError(401, {
                message: "Invalid, expired or malformed token",
                details: "Token is either Invalid or expired or malformed by the user",
            });
        }

        throw error;
    }
};
