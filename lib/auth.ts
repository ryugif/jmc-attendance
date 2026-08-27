import "server-only";

import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "./db";
import { authSchema } from "./schema";
import { username } from "better-auth/plugins";

function requireEnv(name: string, value: string | undefined): string {
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

export const auth = betterAuth({
    secret: requireEnv("BETTER_AUTH_SECRET", process.env.BETTER_AUTH_SECRET),
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    database: drizzleAdapter(db, {
        provider: "mysql",
        schema: authSchema,
    }),
    plugins: [
        username()
    ]
});