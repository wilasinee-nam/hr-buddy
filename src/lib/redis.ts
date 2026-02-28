import Redis from "ioredis";

const REDIS_ENABLED = process.env.REDIS_ENABLED === "true";

const redisClientSingleton = () => {
    if (!REDIS_ENABLED) {
        console.log("[Redis] Disabled - REDIS_ENABLED is not 'true'");
        return null;
    }
    // return new Redis({
    //     host: process.env.REDIS_HOST || "localhost",
    //     port: parseInt(process.env.REDIS_PORT || "6379"),
    //     password: process.env.REDIS_PASSWORD,
    //     maxRetriesPerRequest: null,
    // });
};

declare global {
    var redis: undefined | ReturnType<typeof redisClientSingleton>;
}

const redis = globalThis.redis ?? redisClientSingleton();

export default redis;

if (process.env.NODE_ENV !== "production") globalThis.redis = redis;
