export const expiresAt = (durationMs: number) => {
    return new Date(Date.now() + durationMs);
};
