import { and, eq, inArray } from "drizzle-orm";

import { db } from "./db";
import { role, rolePermission, userRole } from "./schema";

export type ReadAccess = "all" | "own" | "no";
export type UpdateAccess = "all" | "own" | "no";
export type DeleteAccess = "all" | "own" | "no";
export type PermissionAction = "CREATE" | "READ" | "UPDATE" | "DELETE";

export type RolePermission = {
    id: string;
    roleId: string;
    moduleName: string;
    access: boolean;
    create: boolean;
    read: ReadAccess;
    update: UpdateAccess;
    delete: DeleteAccess;
    createdAt: Date;
    updatedAt: Date;
};

export type RolePermissionDefinition = {
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
    permissions: RolePermissionDefinition[];
};

export const MODULE_ALIASES: Record<string, string> = {
    DASHBOARD: "Dashboard",
    "DASHBOARD PAGE": "Dashboard",
    EMPLOYEE: "Employee",
    EMPLOYEES: "Employee",
    ATTENDANCE: "Attendance",
    "TRANSPORT ALLOWANCE": "Transport Allowance",
    "TRANSPORTATION ALLOWANCE": "Transport Allowance",
    USERS: "Users",
    "AUDIT LOG": "Audit Log",
    LOG: "Audit Log",
    SETTINGS: "Settings",
    PROFILE: "Profile",
    "MY PROFILE": "Profile",
};

export const ROLE_DEFINITIONS: RoleDefinition[] = [
    {
        name: "Super Admin",
        description: "Full access to all modules and administrative controls.",
        permissions: [
            { module: "Dashboard", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "Users", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "Employee", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "Attendance", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "Transport Allowance", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "Audit Log", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "Settings", access: true, create: true, read: "all", update: "all", delete: "all" },
        ],
    },
    {
        name: "HRD Manager",
        description: "Can review workforce activity and operational summaries without changing user roles.",
        permissions: [
            { module: "Dashboard", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "Users", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "Employee", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "Attendance", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "Transport Allowance", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "Audit Log", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "Settings", access: false, create: false, read: "no", update: "no", delete: "no" },
        ],
    },
    {
        name: "HRD Admin",
        description: "Can manage employee and attendance data while keeping administrative functions restricted.",
        permissions: [
            { module: "Dashboard", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "Users", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "Employee", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "Attendance", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "Transport Allowance", access: true, create: false, read: "own", update: "no", delete: "no" },
            { module: "Audit Log", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "Settings", access: false, create: false, read: "no", update: "no", delete: "no" },
        ],
    },
];

export class AuthorizationError extends Error {
    constructor(
        public readonly status: number,
        message: string,
    ) {
        super(message);
        this.name = "AuthorizationError";
    }
}

export function normalizeModuleName(moduleName: string): string {
    if (!moduleName) {
        return "";
    }

    const normalized = moduleName.trim();
    const key = normalized.toUpperCase();
    if (MODULE_ALIASES[key]) {
        return MODULE_ALIASES[key];
    }

    return normalized;
}

export function normalizeActionName(action: string): PermissionAction {
    const normalized = action.trim().toUpperCase();
    if (normalized === "CREATE" || normalized === "READ" || normalized === "UPDATE" || normalized === "DELETE") {
        return normalized;
    }
    return "READ";
}

export function getRoleByName(name: string): RoleDefinition | undefined {
    return ROLE_DEFINITIONS.find((roleDefinition) => roleDefinition.name === name);
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

export async function getUserPermissions(userId: string) {
    const assignedRoles = await db
        .select({ roleId: userRole.roleId })
        .from(userRole)
        .where(eq(userRole.userId, userId));

    if (assignedRoles.length === 0) {
        return [] as Array<{
            id: string;
            roleId: string;
            moduleName: string;
            access: boolean;
            create: boolean;
            read: ReadAccess;
            update: UpdateAccess;
            delete: DeleteAccess;
            createdAt: Date;
            updatedAt: Date;
        }>;
    }

    const roleIds = assignedRoles.map((assignment) => assignment.roleId);

    return await db
        .select()
        .from(rolePermission)
        .where(inArray(rolePermission.roleId, roleIds));
}

export function hasPermissionRecord(
    permission: Partial<RolePermission> | null | undefined,
    moduleName: string,
    action: PermissionAction,
) {
    if (!permission) {
        return false;
    }

    const normalizedModule = normalizeModuleName(moduleName);
    const matchModule = normalizeModuleName(permission.moduleName ?? moduleName);
    if (normalizeModuleName(matchModule) !== normalizeModuleName(normalizedModule)) {
        return false;
    }

    if (!permission.access) {
        return false;
    }

    switch (action) {
        case "CREATE":
            return permission.create === true;
        case "READ":
            return permission.read !== "no";
        case "UPDATE":
            return permission.update !== "no";
        case "DELETE":
            return permission.delete !== "no";
        default:
            return false;
    }
}

export async function getUserModulePermission(userId: string, moduleName: string) {
    const permissions = await getUserPermissions(userId);
    const normalizedModule = normalizeModuleName(moduleName);

    return (
        permissions.find(
            (permission) => normalizeModuleName(permission.moduleName) === normalizedModule,
        ) ?? null
    );
}

export async function getUserPermissionMap(userId: string): Promise<Record<string, boolean>> {
    const permissions = await getUserPermissions(userId);
    return permissions.reduce<Record<string, boolean>>((accumulator, permission) => {
        const moduleKey = normalizeModuleName(permission.moduleName);
        accumulator[moduleKey] = permission.access && permission.read !== "no";
        return accumulator;
    }, {});
}

export async function requirePermission(moduleName: string, action: PermissionAction, userId?: string) {
    if (!userId) {
        throw new AuthorizationError(401, "Unauthorized");
    }

    const permission = await getUserModulePermission(userId, moduleName);
    const normalizedAction = normalizeActionName(action);

    if (!permission || !hasPermissionRecord(permission, moduleName, normalizedAction)) {
        throw new AuthorizationError(403, "Forbidden");
    }

    return permission;
}
