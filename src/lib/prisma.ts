import { PrismaClient } from "@/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    // Use DIRECT_URL for pg adapter (pgbouncer URL causes "Tenant or user not found")
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL!;
    const adapter = new PrismaPg({ connectionString });
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
