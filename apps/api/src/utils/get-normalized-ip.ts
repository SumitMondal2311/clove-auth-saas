export const getNormalizedIP = (ip: string) => {
    return ip === "::1" ? "127.0.0.1" : ip;
};
