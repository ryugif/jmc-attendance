"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { eq, count, like, or } from "drizzle-orm";

import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/lib/audit";
import { logAuditEvent } from "@/lib/audit-context";
import { db } from "@/lib/db";
import { jobPosition } from "@/lib/schema";


export async function create(data: {
    name: string;
    description?: string;
    isActive?: boolean;
}) {
    try {
        const id = randomUUID();

        await db.insert(jobPosition).values({
            id,
            name: data.name.trim(),
            description: data.description?.trim() || undefined,
            isActive: data.isActive ?? true,
        });

        await logAuditEvent({
            module: AUDIT_MODULES.JOB_POSITION,
            action: AUDIT_ACTIONS[0],
            resourceId: id,
            description: `Job position ${data.name.trim()} created.`,
        });

        revalidatePath("/dashboard/settings/job-position");
        return { success: true, id };
    } catch (error) {
        console.error("Error creating job position:", error);
        throw new Error("Failed to create job position");
    }
}

export async function update(id: string, data: {
    name?: string;
    description?: string;
    isActive?: boolean;
}) {
    try {
        await db.update(jobPosition).set({
            name: data.name?.trim(),
            description: data.description?.trim(),
            isActive: data.isActive,
        }).where(eq(jobPosition.id, id));

        await logAuditEvent({
            module: AUDIT_MODULES.JOB_POSITION,
            action: AUDIT_ACTIONS[2],
            resourceId: id,
            description: "Job position updated.",
        });

        revalidatePath("/dashboard/settings/job-position");
        return { success: true };
    } catch (error) {
        console.error("Error updating job position:", error);
        throw new Error("Failed to update job position");
    }
}

export async function getList(page: number = 1, pageSize: number = 10) {
    try {
        await logAuditEvent({
            module: AUDIT_MODULES.JOB_POSITION,
            action: AUDIT_ACTIONS[1],
            description: "Job position list accessed.",
        });

        const offset = (page - 1) * pageSize;

        const [jobPositions, totalResult] = await Promise.all([
            db.select().from(jobPosition).limit(pageSize).offset(offset),
            db.select({ count: count() }).from(jobPosition)
        ]);

        const total = totalResult[0]?.count || 0;
        const totalPages = Math.ceil(total / pageSize);

        return {
            success: true,
            data: jobPositions,
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
            }
        };
    } catch (error) {
        console.error("Error fetching job positions:", error);
        throw new Error("Failed to fetch job positions");
    }
}

export async function search(query: string, page: number = 1, pageSize: number = 10) {
    try {
        await logAuditEvent({
            module: AUDIT_MODULES.JOB_POSITION,
            action: AUDIT_ACTIONS[1],
            description: "Job position search executed.",
            metadata: { query },
        });

        const offset = (page - 1) * pageSize;
        const searchQuery = `%${query}%`;

        const [jobPositions, totalResult] = await Promise.all([
            db.select().from(jobPosition).where(
                or(
                    like(jobPosition.name, searchQuery),
                    like(jobPosition.description, searchQuery),
                    like(jobPosition.code, searchQuery)
                )
            ).limit(pageSize).offset(offset),
            db.select({ count: count() }).from(jobPosition).where(
                or(
                    like(jobPosition.name, searchQuery),
                    like(jobPosition.description, searchQuery),
                    like(jobPosition.code, searchQuery)
                )
            )
        ]);

        const total = totalResult[0]?.count || 0;
        const totalPages = Math.ceil(total / pageSize);

        return {
            success: true,
            data: jobPositions,
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
            }
        };
    } catch (error) {
        console.error("Error searching job positions:", error);
        throw new Error("Failed to search job positions");
    }
}

export async function getDetail(id: string) {
    try {
        await logAuditEvent({
            module: AUDIT_MODULES.JOB_POSITION,
            action: AUDIT_ACTIONS[1],
            resourceId: id,
            description: "Job position detail accessed.",
        });

        const result = await db.select().from(jobPosition).where(eq(jobPosition.id, id));

        if (result.length === 0) {
            throw new Error("Job position not found");
        }

        return {
            success: true,
            data: result[0],
        };
    } catch (error) {
        console.error("Error fetching job position:", error);
        throw new Error("Failed to fetch job position");
    }
}

export async function deleteItem(id: string) {
    try {
        const [existing] = await db.select({ name: jobPosition.name }).from(jobPosition).where(eq(jobPosition.id, id)).limit(1);
        await db.delete(jobPosition).where(eq(jobPosition.id, id));

        await logAuditEvent({
            module: AUDIT_MODULES.JOB_POSITION,
            action: AUDIT_ACTIONS[3],
            resourceId: id,
            description: `Job position ${existing?.name || id} deleted.`,
        });

        revalidatePath("/dashboard/settings/job-position");
        return { success: true };
    } catch (error) {
        console.error("Error deleting job position:", error);
        throw new Error("Failed to delete job position");
    }
}
