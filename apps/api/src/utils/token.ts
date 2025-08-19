import { existsSync, readFileSync } from "fs";
import {
    JsonWebTokenError,
    NotBeforeError,
    sign,
    SignOptions,
    TokenExpiredError,
    verify,
} from "jsonwebtoken";
import { resolve } from "path";
import { env } from "../configs/env.js";
import { prisma, Session } from "../db/index.js";
import { AuthPayload } from "../types/auth-payload.js";
import { CloveError } from "./clove-error.js";
import { getUUID } from "./crypto.js";

const secretsDir = resolve(process.cwd(), "src/secrets");
if (existsSync(secretsDir) === false) {
    console.error("Missing secrets directory");
    process.exit(1);
}

const privateKey = readFileSync(resolve(secretsDir, "private.pem"), "utf8");
if (!privateKey) {
    console.error("Missing private key");
    process.exit(1);
}

export const signToken = (payload: AuthPayload, expiresIn: SignOptions["expiresIn"]): string => {
    payload = {
        ...payload,
        iss: env.JWT_ISS,
        jti: getUUID(),
        kid: env.JWT_KID,
    } as AuthPayload;
    return sign(payload, privateKey, {
        expiresIn,
        algorithm: "RS256",
    });
};

const publicKey = readFileSync(resolve(secretsDir, "private.pem"), "utf8");
if (!publicKey) {
    console.error("Missing private key");
    process.exit(1);
}

export const verifyToken = async (
    token: string
): Promise<{
    payload: AuthPayload;
    session: Session;
}> => {
    try {
        const payload = verify(token, publicKey, {
            algorithms: ["RS256"],
            issuer: env.JWT_ISS,
            audience: env.API_ORIGIN,
        }) as AuthPayload;

        const { sub, session_id } = payload;

        const session = await prisma.session.findFirst({
            where: {
                id: session_id,
                userId: sub,
            },
        });

        if (!session) {
            throw new CloveError(404, {
                message: "Session didn't exists",
                details: "Session didn't exists",
            });
        }

        return {
            payload,
            session,
        };
    } catch (error) {
        if (
            error instanceof TokenExpiredError ||
            error instanceof NotBeforeError ||
            error instanceof JsonWebTokenError
        ) {
            throw new CloveError(401, {
                message: "Invalid, expired or malformed token",
                details: "Invalid, expired or malformed token",
            });
        }

        throw new CloveError(500, {
            message: "Failed to verify token",
            details: "Failed to verify token",
        });
    }
};
