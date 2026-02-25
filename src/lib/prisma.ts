import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    const connStr = process.env.DIRECT_URL || process.env.DATABASE_URL!;

    // Parse the URL manually — pg v8's connection string parser
    // breaks TLS SNI which Supabase Supavisor needs for tenant routing
    const url = new URL(connStr.replace(/\?.*$/, "")); // Strip query params
    const isPooler = url.hostname.includes("pooler.supabase.com");

    let pool: Pool;

    if (isPooler) {
        // Supabase pooler: explicit params preserve TLS SNI for tenant routing
        // ssl:true keeps SNI working (ssl:{rejectUnauthorized:false} breaks it in pg v8)
        // NODE_TLS_REJECT_UNAUTHORIZED=0 must be set as env var to accept Supabase certs
        pool = new Pool({
            host: url.hostname,
            port: parseInt(url.port) || 6543,
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.slice(1),
            ssl: true,
            max: 5,
        });
    } else {
        // Direct connection (local dev) — works without special SSL
        pool = new Pool({ connectionString: connStr });
    }

    const adapter = new PrismaPg({ pool });
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
