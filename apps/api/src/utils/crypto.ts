import { randomBytes, randomUUID } from "crypto";

export const getUUID = () => {
    return randomUUID();
};

export const getToken = (size: number) => {
    return randomBytes(size).toString("hex");
};
