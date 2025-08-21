export const redisKey = {
    blacklistJti: (jti: string) => `bl:jti:${jti}`,
};
