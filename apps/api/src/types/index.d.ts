import { User } from "../db/index.js";

declare global {
    namespace Express {
        interface Request {
            authData?: {
                sessionId: string;
                user: User;
            };
        }
    }
}

declare module "jsonwebtoken" {
    interface JwtPayload {
        type: "access" | "refresh";
        session_id: string;
    }
}
