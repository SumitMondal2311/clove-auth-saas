import { Request } from "express";
import { AuthPayload } from "./auth-payload.js";
import { User } from "../db/index.js";

declare global {
    namespace Express {
        interface Request {
            authData?: {
                sessionId?: string;
                user?: User;
                accessJti?: string;
            };
        }
    }
}
