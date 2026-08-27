import { betterAuth, APIError } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { phoneNumber, username } from "better-auth/plugins";
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
    databaseHooks: {
        session: {
            create: {
                async before(session, ctx) {
                    if (!ctx) {
                        return;
                    }

                    const user = (await ctx.context.internalAdapter.findUserById(session.userId)) as
                        | {
                              isActive?: boolean | null;
                          }
                        | null;

                    if (user?.isActive === false) {
                        throw APIError.from("FORBIDDEN", {
                            code: "USER_INACTIVE",
                            message: "Your account is inactive. Please contact the administrator.",
                        });
                    }
                },
            },
        },
    },
    plugins: [
        username({
            displayUsername: false,
        }),
        phoneNumber(),
    ],
});