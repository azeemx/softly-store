import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
throw new Error("DATABASE_URL is required");
}

// Detect local PostgreSQL so SSL is not required for local development.
// Remote PostgreSQL connections use SSL with certificate verification.
const isLocal =
databaseUrl.includes("127.0.0.1") ||
databaseUrl.includes("localhost");

const globalForDb = globalThis as typeof globalThis & {
__arenaNextJsPostgresqlPool?: Pool;
};

export const pool =
globalForDb.__arenaNextJsPostgresqlPool ??
new Pool({
connectionString: databaseUrl,
max: isLocal ? 8 : 10,
ssl: isLocal ? false : { rejectUnauthorized: true },
});

if (process.env.NODE_ENV !== "production") {
globalForDb.__arenaNextJsPostgresqlPool = pool;
}

export const db = drizzle(pool);