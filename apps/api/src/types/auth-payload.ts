import { JwtPayload } from "jsonwebtoken";

export interface AuthPayload extends JwtPayload {
    session_id?: string;
    type?: "acces" | "refresh";
}
