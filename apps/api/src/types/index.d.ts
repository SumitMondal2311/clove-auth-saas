import { JwtPayload } from "jsonwebtoken";
import { User } from "../db/index.js";

declare global {
    namespace Express {
        interface Request {
            authData?: {
                sessionId: string;
                user: User & {
                    emails: {
                        email: string;
                    }[];
                };
            };
        }
    }
}

interface AuthJwtPayload extends JwtPayload {
    type?: "refresh" | "access";
    session_id?: string;
}
