import "dotenv/config";

import { eq } from "drizzle-orm";

import { db } from "../lib/db";
import { ROLE_DEFINITIONS } from "../lib/rbac";
import { role, rolePermission } from "../lib/schema";

async function seedRoles() {
    for (const definition of ROLE_DEFINITIONS) {
        const existingRoles = await db
            .select()
            .from(role)
            .where(eq(role.name, definition.name));

        let roleId: string;

        if (existingRoles.length === 0) {
            const newRoleId = crypto.randomUUID();

            await db.insert(role).values({
                id: newRoleId,
                name: definition.name,
                description: definition.description,
            });

            roleId = newRoleId;
        } else {
            roleId = existingRoles[0].id;
            await db
                .update(role)
                .set({
                    description: definition.description,
                    updatedAt: new Date(),
                })
                .where(eq(role.id, roleId));
        }

        const existingPermissions = await db
            .select()
            .from(rolePermission)
            .where(eq(rolePermission.roleId, roleId));

        const registry = new Map(
            existingPermissions.map((permission) => [permission.moduleName, permission]),
        );

        for (const permission of definition.permissions) {
            const match = registry.get(permission.module);

            if (match) {
                await db
                    .update(rolePermission)
                    .set({
                        access: permission.access,
                        create: permission.create,
                        read: permission.read,
                        update: permission.update,
                        delete: permission.delete,
                        updatedAt: new Date(),
                    })
                    .where(eq(rolePermission.id, match.id));
                continue;
            }

            await db.insert(rolePermission).values({
                id: crypto.randomUUID(),
                roleId,
                moduleName: permission.module,
                access: permission.access,
                create: permission.create,
                read: permission.read,
                update: permission.update,
                delete: permission.delete,
            });
        }
    }

    console.log("RBAC roles and permissions seeded successfully.");
}

void seedRoles().catch((error) => {
    console.error("Failed to seed RBAC roles:", error);
    process.exitCode = 1;
});
