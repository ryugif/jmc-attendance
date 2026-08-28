"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { eq, count, like, or } from "drizzle-orm";

import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/lib/audit";
import { logAuditEvent } from "@/lib/audit-context";
import { db } from "@/lib/db";
import { province, regency } from "@/lib/schema";


export async function create(data: {
    name: string;
    description?: string;
    provinceId: string;
    isActive?: boolean;
}) {
    try {
        const id = randomUUID();

        await db.insert(regency).values({
            id,
            name: data.name.trim(),
            description: data.description?.trim() || undefined,
            provinceId: data.provinceId,
            isActive: data.isActive ?? true,
        });

        await logAuditEvent({
            module: AUDIT_MODULES.REGENCY,
            action: AUDIT_ACTIONS[0],
            resourceId: id,
            description: `Regency ${data.name.trim()} created.`,
        });

        revalidatePath("/dashboard/settings/regency");
        return { success: true, id };
    } catch (error) {
        console.error("Error creating regency:", error);
        throw new Error("Failed to create regency");
    }
}

export async function update(id: string, data: {
    name?: string;
    description?: string;
    provinceId?: string;
    isActive?: boolean;
}) {
    try {
        await db.update(regency).set({
            name: data.name?.trim(),
            description: data.description?.trim(),
            provinceId: data.provinceId,
            isActive: data.isActive,
        }).where(eq(regency.id, id));

        await logAuditEvent({
            module: AUDIT_MODULES.REGENCY,
            action: AUDIT_ACTIONS[2],
            resourceId: id,
            description: "Regency updated.",
        });

        revalidatePath("/dashboard/settings/regency");
        return { success: true };
    } catch (error) {
        console.error("Error updating regency:", error);
        throw new Error("Failed to update regency");
    }
}

export async function getList(page: number = 1, pageSize: number = 10) {
    try {
        await logAuditEvent({
            module: AUDIT_MODULES.REGENCY,
            action: AUDIT_ACTIONS[1],
            description: "Regency list accessed.",
        });

        const offset = (page - 1) * pageSize;

        const [regencies, totalResult] = await Promise.all([
            db.select().from(regency).limit(pageSize).offset(offset),
            db.select({ count: count() }).from(regency)
        ]);

        const total = totalResult[0]?.count || 0;
        const totalPages = Math.ceil(total / pageSize);

        return {
            success: true,
            data: regencies,
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
            }
        };
    } catch (error) {
        console.error("Error fetching regencies:", error);
        throw new Error("Failed to fetch regencies");
    }
}

export async function search(query: string, page: number = 1, pageSize: number = 10) {
    try {
        await logAuditEvent({
            module: AUDIT_MODULES.REGENCY,
            action: AUDIT_ACTIONS[1],
            description: "Regency search executed.",
            metadata: { query },
        });

        const offset = (page - 1) * pageSize;
        const searchQuery = `%${query}%`;

        const [regencies, totalResult] = await Promise.all([
            db.select().from(regency).where(
                or(
                    like(regency.name, searchQuery),
                    like(regency.description, searchQuery),
                    like(regency.code, searchQuery)
                )
            ).limit(pageSize).offset(offset),
            db.select({ count: count() }).from(regency).where(
                or(
                    like(regency.name, searchQuery),
                    like(regency.description, searchQuery),
                    like(regency.code, searchQuery)
                )
            )
        ]);

        const total = totalResult[0]?.count || 0;
        const totalPages = Math.ceil(total / pageSize);

        return {
            success: true,
            data: regencies,
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
            }
        };
    } catch (error) {
        console.error("Error searching regencies:", error);
        throw new Error("Failed to search regencies");
    }
}

export async function getDetail(id: string) {
    try {
        await logAuditEvent({
            module: AUDIT_MODULES.REGENCY,
            action: AUDIT_ACTIONS[1],
            resourceId: id,
            description: "Regency detail accessed.",
        });

        const result = await db.select().from(regency)
            .leftJoin(province, eq(province.id, regency.provinceId))
            .where(eq(regency.id, id))

        if (result.length === 0) {
            throw new Error("Regency not found");
        }

        return {
            success: true,
            data: result[0],
        };
    } catch (error) {
        console.error("Error fetching regency:", error);
        throw new Error("Failed to fetch regency");
    }
}

export async function deleteItem(id: string) {
    try {
        const [existing] = await db.select({ name: regency.name }).from(regency).where(eq(regency.id, id)).limit(1);
        await db.delete(regency).where(eq(regency.id, id));

        await logAuditEvent({
            module: AUDIT_MODULES.REGENCY,
            action: AUDIT_ACTIONS[3],
            resourceId: id,
            description: `Regency ${existing?.name || id} deleted.`,
        });

        revalidatePath("/dashboard/settings/regency");
        return { success: true };
    } catch (error) {
        console.error("Error deleting regency:", error);
        throw new Error("Failed to delete regency");
    }
}
