"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { eq, count, like, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { department } from "@/lib/schema";


export async function create(data: {
    name: string;
    description?: string;
    isActive?: boolean;
}) {
    try {
        const id = randomUUID();

        await db.insert(department).values({
            id,
            name: data.name.trim(),
            description: data.description?.trim() || undefined,
            isActive: data.isActive ?? true,
        });

        revalidatePath("/dashboard/settings/department");
        return { success: true, id };
    } catch (error) {
        console.error("Error creating department:", error);
        throw new Error("Failed to create department");
    }
}

export async function update(id: string, data: {
    name?: string;
    description?: string;
    isActive?: boolean;
}) {
    try {
        await db.update(department).set({
            name: data.name?.trim(),
            description: data.description?.trim(),
            isActive: data.isActive,
        }).where(eq(department.id, id));

        revalidatePath("/dashboard/settings/department");
        return { success: true };
    } catch (error) {
        console.error("Error updating department:", error);
        throw new Error("Failed to update department");
    }
}

export async function getList(page: number = 1, pageSize: number = 10) {
    try {
        const offset = (page - 1) * pageSize;

        const [departments, totalResult] = await Promise.all([
            db.select().from(department).limit(pageSize).offset(offset),
            db.select({ count: count() }).from(department)
        ]);

        const total = totalResult[0]?.count || 0;
        const totalPages = Math.ceil(total / pageSize);

        return {
            success: true,
            data: departments,
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
            }
        };
    } catch (error) {
        console.error("Error fetching departments:", error);
        throw new Error("Failed to fetch departments");
    }
}

export async function search(query: string, page: number = 1, pageSize: number = 10) {
    try {
        const offset = (page - 1) * pageSize;
        const searchQuery = `%${query}%`;

        const [departments, totalResult] = await Promise.all([
            db.select().from(department).where(
                or(
                    like(department.name, searchQuery),
                    like(department.description, searchQuery),
                    like(department.code, searchQuery)
                )
            ).limit(pageSize).offset(offset),
            db.select({ count: count() }).from(department).where(
                or(
                    like(department.name, searchQuery),
                    like(department.description, searchQuery),
                    like(department.code, searchQuery)
                )
            )
        ]);

        const total = totalResult[0]?.count || 0;
        const totalPages = Math.ceil(total / pageSize);

        return {
            success: true,
            data: departments,
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
            }
        };
    } catch (error) {
        console.error("Error searching departments:", error);
        throw new Error("Failed to search departments");
    }
}

export async function getDetail(id: string) {
    try {
        const result = await db.select().from(department).where(eq(department.id, id));

        if (result.length === 0) {
            throw new Error("Department not found");
        }

        return {
            success: true,
            data: result[0],
        };
    } catch (error) {
        console.error("Error fetching department:", error);
        throw new Error("Failed to fetch department");
    }
}

export async function deleteItem(id: string) {
    try {
        await db.delete(department).where(eq(department.id, id));

        revalidatePath("/dashboard/settings/department");
        return { success: true };
    } catch (error) {
        console.error("Error deleting department:", error);
        throw new Error("Failed to delete department");
    }
}
