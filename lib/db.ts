import { drizzle } from "drizzle-orm/mysql2";
import { createPool } from "mysql2";

const databaseUrl = process.env.DATABASE_URL ?? "mysql://better_auth:better_auth@127.0.0.1:3306/better_auth";

const pool = createPool({
    uri: databaseUrl,
    timezone: "Z",
    connectionLimit: 10,
});

export const db = drizzle({
    client: pool,
});

export { pool };