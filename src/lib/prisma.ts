import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    // On Vercel: use DATABASE_URL (pooler) — direct URL unreachable (IPv6 only)
    // On local: use DIRECT_URL (direct) — faster and simpler
    const isVercel = !!process.env.VERCEL;
    const connectionString = isVercel
        ? process.env.DATABASE_URL!
        : (process.env.DIRECT_URL || process.env.DATABASE_URL!);

    if (!connectionString) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    // IMPORTANT: Do NOT pass explicit ssl options!
    // pg handles TLS automatically from the connection string.
    // Passing ssl: { rejectUnauthorized: false } or any ssl object
    // breaks SNI which Supabase Supavisor needs for tenant routing.
    // (Meetcase uses the same pattern and works.)
    const pool = new Pool({
        connectionString,
        max: 5,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
    });

    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}

// Cache prisma instance in both development AND production
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Always cache to prevent connection pool exhaustion in serverless
globalForPrisma.prisma = prisma;

export default prisma;
