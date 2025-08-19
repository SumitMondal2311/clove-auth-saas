import { env } from "./env.js";

export const constant = {
    IS_PRODUCTION: env.NODE_ENV === "production",
    REFRESH_TOKEN_EXPIRY_MS: env.REFRESH_TOKEN_EXPIRY * 1000,
    ACCESS_TOKEN_EXPIRY_MS: env.ACCESS_TOKEN_EXPIRY * 1000,
};
