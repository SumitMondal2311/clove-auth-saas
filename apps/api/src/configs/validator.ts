import z from "zod";

export const envSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]),
    PORT: z.string().min(4).transform(Number),
    WEB_ORIGIN: z.string(),
    API_ORIGIN: z.string().optional(),
    DB_URL: z.string(),
    REDIS_URL: z.string(),
    DB_MAX_RETRIES: z.string().transform(Number),
    JWT_KID: z.string(),
    JWT_ISS: z.string(),
    SESSION_LIMIT: z.string(),
    REFRESH_TOKEN_EXPIRY: z.string().transform((str) => eval(str)),
    ACCESS_TOKEN_EXPIRY: z.string().transform((str) => eval(str)),
    EMAIL_VERIFICATION_TOKEN_EXPIRY_MS: z.string().transform((str) => eval(str)),
});

export const authSchema = z.object({
    email: z.email("Invalid email"),
    password: z.string().nonempty("Password is required"),
});
