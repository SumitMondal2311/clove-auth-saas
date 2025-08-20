export const normalizedIP = (ip: string) => {
    return ip === "::1" ? "127.0.0.1" : ip;
};
