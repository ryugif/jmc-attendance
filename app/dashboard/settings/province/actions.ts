"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { eq, count, like, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { province } from "@/lib/schema";


export async function create(data: {
    name: string;
    description?: string;
    isActive?: boolean;
}) {
    try {
        const id = randomUUID();

        await db.insert(province).values({
            id,
            name: data.name.trim(),
            description: data.description?.trim() || undefined,
            isActive: data.isActive ?? true,
        });

        revalidatePath("/dashboard/settings/province");
        return { success: true, id };
    } catch (error) {
        console.error("Error creating province:", error);
        throw new Error("Failed to create province");
    }
}

export async function update(id: string, data: {
    name?: string;
    description?: string;
    isActive?: boolean;
}) {
    try {
        await db.update(province).set({
            name: data.name?.trim(),
            description: data.description?.trim(),
            isActive: data.isActive,
        }).where(eq(province.id, id));

        revalidatePath("/dashboard/settings/province");
        return { success: true };
    } catch (error) {
        console.error("Error updating province:", error);
        throw new Error("Failed to update province");
    }
}

export async function getList(page: number = 1, pageSize: number = 10) {
    try {
        const offset = (page - 1) * pageSize;

        const [provinces, totalResult] = await Promise.all([
            db.select().from(province).limit(pageSize).offset(offset),
            db.select({ count: count() }).from(province)
        ]);

        const total = totalResult[0]?.count || 0;
        const totalPages = Math.ceil(total / pageSize);

        return {
            success: true,
            data: provinces,
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
            }
        };
    } catch (error) {
        console.error("Error fetching provinces:", error);
        throw new Error("Failed to fetch provinces");
    }
}

export async function search(query: string, page: number = 1, pageSize: number = 10) {
    try {
        const offset = (page - 1) * pageSize;
        const searchQuery = `%${query}%`;

        const [provinces, totalResult] = await Promise.all([
            db.select().from(province).where(
                or(
                    like(province.name, searchQuery),
                    like(province.description, searchQuery),
                    like(province.code, searchQuery)
                )
            ).limit(pageSize).offset(offset),
            db.select({ count: count() }).from(province).where(
                or(
                    like(province.name, searchQuery),
                    like(province.description, searchQuery),
                    like(province.code, searchQuery)
                )
            )
        ]);

        const total = totalResult[0]?.count || 0;
        const totalPages = Math.ceil(total / pageSize);

        return {
            success: true,
            data: provinces,
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
            }
        };
    } catch (error) {
        console.error("Error searching provinces:", error);
        throw new Error("Failed to search provinces");
    }
}

export async function getDetail(id: string) {
    try {
        const result = await db.select().from(province).where(eq(province.id, id));

        if (result.length === 0) {
            throw new Error("Province not found");
        }

        return {
            success: true,
            data: result[0],
        };
    } catch (error) {
        console.error("Error fetching province:", error);
        throw new Error("Failed to fetch province");
    }
}

export async function deleteItem(id: string) {
    try {
        await db.delete(province).where(eq(province.id, id));

        revalidatePath("/dashboard/settings/province");
        return { success: true };
    } catch (error) {
        console.error("Error deleting province:", error);
        throw new Error("Failed to delete province");
    }
}
