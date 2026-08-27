import "dotenv/config";

import { and, eq } from "drizzle-orm";

import { auth } from "../lib/auth";
import { db } from "../lib/db";
import { role, userRole } from "../lib/schema";

async function getOrCreateSuperAdminRole() {
    const existing = await db
        .select()
        .from(role)
        .where(eq(role.name, "Super Admin"));

    if (existing[0]) {
        return existing[0];
    }

    const inserted = await db.insert(role).values({
        id: crypto.randomUUID(),
        name: "Super Admin",
        description: "Full access to all modules and administrative controls.",
    });

    const insertedId = (inserted[0] as { insertId?: number | bigint | string } | undefined)?.insertId;

    if (insertedId !== undefined && insertedId !== null) {
        return { id: String(insertedId), name: "Super Admin" };
    }

    const recreated = await db
        .select()
        .from(role)
        .where(eq(role.name, "Super Admin"));

    if (!recreated[0]) {
        throw new Error("Unable to create or find Super Admin role.");
    }

    return recreated[0];
}

async function main() {
    const email = process.env.SUPER_ADMIN_EMAIL ?? "superadmin@example.com";
    const name = process.env.SUPER_ADMIN_NAME ?? "Super Admin";
    const username = process.env.SUPER_ADMIN_USERNAME ?? "superadmin";
    const password = process.env.SUPER_ADMIN_PASSWORD ?? "SuperAdmin123!";

    try {
        const user = await auth.api.createUser({
            body: {
                email,
                name,
                password,
                role: "admin",
                data: {
                    username,
                },
            },
        });

        const superAdminRole = await getOrCreateSuperAdminRole();

        const existingAssignment = await db
            .select()
            .from(userRole)
            .where(and(eq(userRole.userId, user.user.id), eq(userRole.roleId, superAdminRole.id)));

        if (existingAssignment.length === 0) {
            await db.insert(userRole).values({
                id: crypto.randomUUID(),
                userId: user.user.id,
                roleId: superAdminRole.id,
            });
        }

        console.log("Super admin created successfully.");
        console.log(JSON.stringify({
            email: user.user.email,
            username,
            authRole: user.user.role ?? "admin",
            rbacRole: superAdminRole.name,
        }, null, 2));
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        if (message.toLowerCase().includes("already exists") || message.toLowerCase().includes("user already exists")) {
            console.log(`Super admin already exists for ${email}.`);
            return;
        }

        console.error("Failed to create super admin.");
        console.error(message);
        process.exitCode = 1;
    }
}

void main();
