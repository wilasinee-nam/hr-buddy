import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import redis from "@/lib/redis";

export async function GET() {
    const status: any = {
        mysql: "Checking...",
        redis: "Checking...",
    };

    // Test MySQL (Prisma)
    try {
        await prisma.$connect();
        status.mysql = "Connected successfully! (Prisma)";
    } catch (error: any) {
        status.mysql = `Connection Failed: ${error.message}`;
    }

    // Test Redis
    try {
        await redis.set("test-key", "Hello from Redis at " + new Date().toISOString());
        const val = await redis.get("test-key");
        status.redis = `Connected successfully! (ioredis) - Value: ${val}`;
    } catch (error: any) {
        status.redis = `Connection Failed: ${error.message}`;
    }

    return NextResponse.json(status);
}
