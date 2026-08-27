import { and, eq } from "drizzle-orm";

import { db } from "./db";
import { role, rolePermission, userRole } from "./schema";

export type ReadAccess = "all" | "own" | "no";
export type UpdateAccess = "all" | "own" | "no";
export type DeleteAccess = "all" | "own" | "no";

export type RolePermission = {
    module: string;
    access: boolean;
    create: boolean;
    read: ReadAccess;
    update: UpdateAccess;
    delete: DeleteAccess;
};

export type RoleDefinition = {
    name: string;
    description: string;
    permissions: RolePermission[];
};

export const ROLE_DEFINITIONS: RoleDefinition[] = [
    {
        name: "Super Admin",
        description: "Full access to all modules and administrative controls.",
        permissions: [
            { module: "login", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "manage_roles", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "manage_users", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "my_profile", access: true, create: false, read: "all", update: "own", delete: "no" },
            { module: "dashboard", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "employee_data", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "attendance", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "transportation_allowance", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "transportation_allowance_settings", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "log", access: true, create: false, read: "all", update: "no", delete: "no" },
        ],
    },
    {
        name: "HRD Manager",
        description: "Can view role-based reporting but cannot manage user roles or core admin privileges.",
        permissions: [
            { module: "login", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "manage_roles", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "manage_users", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "my_profile", access: true, create: false, read: "all", update: "own", delete: "no" },
            { module: "dashboard", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "employee_data", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "attendance", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "transportation_allowance", access: true, create: false, read: "own", update: "no", delete: "no" },
            { module: "transportation_allowance_settings", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "log", access: false, create: false, read: "no", update: "no", delete: "no" },
        ],
    },
    {
        name: "HRD Admin",
        description: "Can manage employee and attendance data while keeping super-admin employee data restricted.",
        permissions: [
            { module: "login", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "manage_roles", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "manage_users", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "my_profile", access: true, create: false, read: "all", update: "own", delete: "no" },
            { module: "dashboard", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "employee_data", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "attendance", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "transportation_allowance", access: true, create: false, read: "own", update: "no", delete: "no" },
            { module: "transportation_allowance_settings", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "log", access: false, create: false, read: "no", update: "no", delete: "no" },
        ],
    },
];

export function getRoleByName(name: string): RoleDefinition | undefined {
    return ROLE_DEFINITIONS.find((role) => role.name === name);
}

export async function getUserRoleRecordByUserId(userId: string) {
    const assigned = await db
        .select({ roleId: userRole.roleId })
        .from(userRole)
        .where(eq(userRole.userId, userId))
        .limit(1);

    const roleId = assigned[0]?.roleId;
    if (!roleId) {
        return null;
    }

    const [record] = await db.select().from(role).where(eq(role.id, roleId)).limit(1);
    return record ?? null;
}

export async function getUserRoleNameByUserId(userId: string): Promise<string> {
    const record = await getUserRoleRecordByUserId(userId);
    return record?.name ?? "User";
}

export async function getUserModulePermission(userId: string, moduleName: string) {
    const roleRecord = await getUserRoleRecordByUserId(userId);
    if (!roleRecord) {
        return null;
    }

    const [permission] = await db
        .select()
        .from(rolePermission)
        .where(and(eq(rolePermission.roleId, roleRecord.id), eq(rolePermission.moduleName, moduleName)))
        .limit(1);

    return permission ?? null;
}
