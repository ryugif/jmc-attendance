"use server";

import { eq, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { user } from "@/lib/schema";

export async function checkLoginEligibility(identifier: string) {
    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier) {
        return { allowed: true };
    }

    const [existingUser] = await db
        .select({ isActive: user.isActive })
        .from(user)
        .where(
            or(
                eq(user.email, normalizedIdentifier),
                eq(user.username, normalizedIdentifier),
                eq(user.phoneNumber, normalizedIdentifier),
            ),
        )
        .limit(1);

    if (!existingUser) {
        return { allowed: true };
    }

    if (existingUser.isActive === false) {
        return {
            allowed: false,
            reason: "inactive",
        };
    }

    return { allowed: true };
}
