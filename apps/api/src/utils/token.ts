import { existsSync, readFileSync } from "fs";
import jwt from "jsonwebtoken";
import { resolve } from "path";
import { env } from "../configs/env.js";
import { AuthJwtPayload } from "../types/index.js";
import { CloveError } from "./clove-error.js";

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
    payload: AuthJwtPayload,
    expiresIn: jwt.SignOptions["expiresIn"]
): string => {
    payload = {
        ...payload,
        iss: env.JWT_ISS,
        kid: env.JWT_KID,
    };
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

export const verifyToken = async (token: string): Promise<AuthJwtPayload> => {
    try {
        return jwt.verify(token, publicKey, {
            algorithms: ["RS256"],
            issuer: env.JWT_ISS,
        }) as AuthJwtPayload;
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
