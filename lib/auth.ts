import { betterAuth, APIError } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { phoneNumber, username } from "better-auth/plugins";
import { db } from "./db";
import { recordAuditLog, AUDIT_ACTIONS, AUDIT_MODULES } from "./audit";
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
                async after(session, ctx) {
                    const user = (await ctx?.context.internalAdapter.findUserById(session.userId)) as
                        | {
                            name?: string | null;
                            username?: string | null;
                        }
                        | null;

                    await recordAuditLog({
                        userId: session.userId,
                        userName: user?.name || user?.username || "User",
                        module: AUDIT_MODULES.LOG,
                        action: AUDIT_ACTIONS[4],
                        description: "User signed in.",
                        ipAddress: session.ipAddress ?? null,
                        userAgent: session.userAgent ?? null,
                        metadata: {
                            sessionId: session.id,
                        },
                    });
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