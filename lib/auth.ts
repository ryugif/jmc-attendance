import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { admin, phoneNumber, username } from "better-auth/plugins";
import { db } from "./db";
import { authSchema } from "./schema";

function requireEnv(name: string, value: string | undefined, fallback?: string): string {
    if (!value) {
        if (fallback !== undefined) return fallback;
        throw new Error(`Missing required environment variable: ${name}`);
    }
    return value;
}

export const auth = betterAuth({
    secret: requireEnv("BETTER_AUTH_SECRET", process.env.BETTER_AUTH_SECRET, "dev-secret-change-me"),
    baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
    database: drizzleAdapter(db, {
        provider: "mysql",
        schema: authSchema,
    }),
    emailAndPassword: {
        enabled: true,
        autoSignIn: true,
        requireEmailVerification: false,
    },
    plugins: [
        username(),
        phoneNumber(),
        admin(),
    ],
});