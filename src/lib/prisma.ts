import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";



const prismaClientSingleton = () => {
    const connectionString = process.env.DATABASE_URL;
    console.log("[Prisma] DATABASE_URL:", connectionString);
    const adapter = new PrismaPg(connectionString!);
    const client = new PrismaClient({
        adapter,
        log: [
            {
                emit: 'event',
                level: 'query',
            },
            {
                emit: 'stdout',
                level: 'error',
            },
            {
                emit: 'stdout',
                level: 'info',
            },
            {
                emit: 'stdout',
                level: 'warn',
            },
        ],
    });

    // @ts-ignore
    client.$on('query', (e) => {
        // Use process.stdout.write to avoid Next.js forwarding logs to the client browser console
        process.stdout.write(`Query: ${e.query}\nParams: ${e.params}\nDuration: ${e.duration}ms\n`);
    });

    return client;
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
