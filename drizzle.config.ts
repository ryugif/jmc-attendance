import "dotenv/config";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./lib/schema.ts",
    out: "./drizzle",
    dialect: "mysql",
    dbCredentials: {
        url: process.env.DATABASE_URL ?? "mysql://better_auth:better_auth@127.0.0.1:3306/better_auth",
    },
});