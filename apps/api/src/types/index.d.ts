import { User } from "../db/index.js";

declare global {
    namespace Express {
        interface Request {
            authData?: {
                sessionId?: string;
                user?: User;
            };
        }
    }
}
