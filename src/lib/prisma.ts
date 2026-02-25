import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Enable WebSocket for @neondatabase/serverless in Node.js environment
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    // On Vercel: use DATABASE_URL (pooler) — direct URL unreachable (IPv6 only)
    // On local: use DIRECT_URL (direct) — faster and simpler
    const isVercel = !!process.env.VERCEL;
    const connStr = isVercel
        ? process.env.DATABASE_URL!
        : (process.env.DIRECT_URL || process.env.DATABASE_URL!);

    const adapter = new PrismaNeon({ connectionString: connStr });
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
