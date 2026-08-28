import { and, asc, count, desc, eq, gte, like, lte, or, type SQL } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";
import { auditLog } from "@/lib/schema";

export const AUDIT_ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE", "LOGIN", "LOGOUT"] as const;

export const AUDIT_MODULES = {
    DASHBOARD: "Dashboard",
    USERS: "Users",
    EMPLOYEES: "Employee",
    ATTENDANCE: "Attendance",
    TRANSPORT_ALLOWANCE: "Transport Allowance",
    TRANSPORT_ALLOWANCE_SETTINGS: "Transport Allowance Settings",
    SETTINGS: "Settings",
    PROVINCE: "Province",
    REGENCY: "Regency",
    DISTRICT: "District",
    DEPARTMENT: "Department",
    JOB_POSITION: "Job Position",
    LOG: "Audit Log",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditModule = (typeof AUDIT_MODULES)[keyof typeof AUDIT_MODULES];

export type AuditLogEntry = {
    userId: string;
    userName: string;
    module: AuditModule | string;
    action: AuditAction;
    resourceId?: string | null;
    description?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    metadata?: Record<string, unknown> | null;
};

export type AuditLogFilters = {
    userId?: string;
    module?: string;
    action?: AuditAction | string;
    search?: string;
    from?: Date | null;
    to?: Date | null;
};

export type AuditLogSortField = "createdAt" | "userName" | "module" | "action";
export type AuditLogSortDirection = "asc" | "desc";

function serializeMetadata(metadata?: Record<string, unknown> | null) {
    if (!metadata) {
        return null;
    }

    try {
        return JSON.stringify(metadata);
    } catch {
        return null;
    }
}

function parseMetadata(metadata: string | null) {
    if (!metadata) {
        return null;
    }

    try {
        return JSON.parse(metadata) as Record<string, unknown>;
    } catch {
        return null;
    }
}

export function formatAuditAction(action: string) {
    switch (action) {
        case "CREATE":
            return "Create";
        case "READ":
            return "Read";
        case "UPDATE":
            return "Update";
        case "DELETE":
            return "Delete";
        case "LOGIN":
            return "Login";
        case "LOGOUT":
            return "Logout";
        default:
            return action;
    }
}

export function getAuditActionBadgeClass(action: string) {
    switch (action) {
        case "CREATE":
            return "bg-emerald-500/10 text-emerald-700";
        case "READ":
            return "bg-sky-500/10 text-sky-700";
        case "UPDATE":
            return "bg-amber-500/10 text-amber-700";
        case "DELETE":
            return "bg-red-500/10 text-red-700";
        case "LOGIN":
            return "bg-blue-500/10 text-blue-700";
        case "LOGOUT":
            return "bg-zinc-500/10 text-zinc-700";
        default:
            return "bg-zinc-500/10 text-zinc-700";
    }
}

export async function recordAuditLog(entry: AuditLogEntry) {
    await db.insert(auditLog).values({
        id: randomUUID(),
        userId: entry.userId,
        userName: entry.userName,
        module: entry.module,
        action: entry.action,
        resourceId: entry.resourceId ?? null,
        description: entry.description ?? null,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
        metadata: serializeMetadata(entry.metadata),
    });
}

export async function getAuditLogById(id: string) {
    const [record] = await db
        .select()
        .from(auditLog)
        .where(eq(auditLog.id, id))
        .limit(1);

    if (!record) {
        throw new Error("Audit log not found.");
    }

    return {
        id: record.id,
        userId: record.userId,
        userName: record.userName,
        module: record.module,
        action: record.action,
        resourceId: record.resourceId,
        description: record.description,
        ipAddress: record.ipAddress,
        userAgent: record.userAgent,
        metadata: parseMetadata(record.metadata),
        createdAt: record.createdAt,
    };
}

export async function getAuditLogList({
    page = 1,
    pageSize = 10,
    sortField = "createdAt",
    sortDirection = "desc",
    filters = {},
}: {
    page?: number;
    pageSize?: number;
    sortField?: AuditLogSortField;
    sortDirection?: AuditLogSortDirection;
    filters?: AuditLogFilters;
}) {
    const offset = (page - 1) * pageSize;
    const clauses: SQL[] = [];

    if (filters.userId) {
        clauses.push(eq(auditLog.userId, filters.userId));
    }

    if (filters.module) {
        clauses.push(eq(auditLog.module, filters.module));
    }

    if (filters.action) {
        clauses.push(eq(auditLog.action, filters.action as AuditAction));
    }

    if (filters.search) {
        const normalized = `%${filters.search.trim()}%`;
        clauses.push(
            or(
                like(auditLog.userName, normalized),
                like(auditLog.module, normalized),
                like(auditLog.action, normalized),
                like(auditLog.description, normalized),
                like(auditLog.resourceId, normalized),
            ) as SQL,
        );
    }

    if (filters.from) {
        clauses.push(gte(auditLog.createdAt, filters.from));
    }

    if (filters.to) {
        clauses.push(lte(auditLog.createdAt, filters.to));
    }

    const whereClause = clauses.length > 0 ? and(...clauses) : undefined;

    const sortColumn = {
        createdAt: auditLog.createdAt,
        userName: auditLog.userName,
        module: auditLog.module,
        action: auditLog.action,
    }[sortField];

    const orderByClause = sortDirection === "asc" ? asc(sortColumn) : desc(sortColumn);

    const [rows, totalResult, users] = await Promise.all([
        db
            .select({
                id: auditLog.id,
                userId: auditLog.userId,
                userName: auditLog.userName,
                module: auditLog.module,
                action: auditLog.action,
                resourceId: auditLog.resourceId,
                description: auditLog.description,
                createdAt: auditLog.createdAt,
            })
            .from(auditLog)
            .where(whereClause)
            .orderBy(orderByClause)
            .limit(pageSize)
            .offset(offset),
        db.select({ count: count() }).from(auditLog).where(whereClause),
        db
            .select({ userId: auditLog.userId, userName: auditLog.userName })
            .from(auditLog)
            .groupBy(auditLog.userId, auditLog.userName)
            .orderBy(desc(auditLog.userName))
            .limit(100),
    ]);

    const total = Number(totalResult[0]?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
        success: true,
        data: rows,
        users,
        modules: Object.values(AUDIT_MODULES),
        actions: AUDIT_ACTIONS,
        pagination: {
            page,
            pageSize,
            total,
            totalPages,
        },
    };
}
