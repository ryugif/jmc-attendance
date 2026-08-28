import { and, asc, count, desc, eq, gte, like, lte, or, type SQL } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { db } from "@/lib/db";
import { AUDIT_ACTIONS, AUDIT_MODULES, type AuditAction, type AuditModule } from "@/lib/audit-helpers";
import { normalizeModuleName } from "@/lib/rbac";
import { auditLog } from "@/lib/schema";

export { AUDIT_ACTIONS, AUDIT_MODULES };
export type { AuditAction, AuditModule };

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

function normalizeFilterValue(value?: string | null) {
    return value?.trim() || undefined;
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
    const normalizedUserId = normalizeFilterValue(filters.userId);
    const normalizedModule = normalizeFilterValue(filters.module);
    const normalizedAction = normalizeFilterValue(filters.action)?.toUpperCase();
    const normalizedSearch = normalizeFilterValue(filters.search);

    if (normalizedUserId) {
        clauses.push(eq(auditLog.userId, normalizedUserId));
    }

    if (normalizedModule) {
        const aliasModule = normalizeModuleName(normalizedModule);
        clauses.push(eq(auditLog.module, aliasModule));
    }

    if (normalizedAction) {
        clauses.push(eq(auditLog.action, normalizedAction as AuditAction));
    }

    if (normalizedSearch) {
        const normalized = `%${normalizedSearch}%`;
        clauses.push(
            or(
                like(auditLog.userName, normalized),
                like(auditLog.module, normalized),
                like(auditLog.action, normalized),
                like(auditLog.description, normalized),
                like(auditLog.resourceId, normalized),
                like(auditLog.userId, normalized),
            ) as SQL,
        );
    }

    if (filters.from) {
        clauses.push(gte(auditLog.createdAt, filters.from));
    }

    if (filters.to) {
        const endOfDay = new Date(filters.to);
        endOfDay.setHours(23, 59, 59, 999);
        clauses.push(lte(auditLog.createdAt, endOfDay));
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
