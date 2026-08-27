import "server-only";

import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    throw new Error("Missing required environment variable: DATABASE_URL");
}

const pool = createPool({
    uri: databaseUrl,
    timezone: "Z",
    connectionLimit: 10,
});

export const db = drizzle({
    client: pool,
});

export { pool };