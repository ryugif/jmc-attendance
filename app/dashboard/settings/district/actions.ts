"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { eq, count, like, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { district, regency } from "@/lib/schema";

export async function create(data: {
    name: string;
    description?: string;
    regencyId: string;
    isActive?: boolean;
}) {
    try {
        const id = randomUUID();

        await db.insert(district).values({
            id,
            name: data.name.trim(),
            description: data.description?.trim() || undefined,
            regencyId: data.regencyId,
            isActive: data.isActive ?? true,
        });

        revalidatePath("/dashboard/settings/district");
        return { success: true, id };
    } catch (error) {
        console.error("Error creating district:", error);
        throw new Error("Failed to create district");
    }
}

export async function update(id: string, data: {
    name?: string;
    description?: string;
    regencyId?: string;
    isActive?: boolean;
}) {
    try {
        await db.update(district).set({
            name: data.name?.trim(),
            description: data.description?.trim(),
            regencyId: data.regencyId,
            isActive: data.isActive,
        }).where(eq(district.id, id));

        revalidatePath("/dashboard/settings/district");
        return { success: true };
    } catch (error) {
        console.error("Error updating district:", error);
        throw new Error("Failed to update district");
    }
}

export async function getList(page: number = 1, pageSize: number = 10) {
    try {
        const offset = (page - 1) * pageSize;

        const [districts, totalResult] = await Promise.all([
            db.select().from(district).limit(pageSize).offset(offset),
            db.select({ count: count() }).from(district)
        ]);

        const total = totalResult[0]?.count || 0;
        const totalPages = Math.ceil(total / pageSize);

        return {
            success: true,
            data: districts,
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
            }
        };
    } catch (error) {
        console.error("Error fetching districts:", error);
        throw new Error("Failed to fetch districts");
    }
}

export async function search(query: string, page: number = 1, pageSize: number = 10) {
    try {
        const offset = (page - 1) * pageSize;
        const searchQuery = `%${query}%`;

        const [districts, totalResult] = await Promise.all([
            db.select().from(district).where(
                or(
                    like(district.name, searchQuery),
                    like(district.description, searchQuery),
                    like(district.code, searchQuery)
                )
            ).limit(pageSize).offset(offset),
            db.select({ count: count() }).from(district).where(
                or(
                    like(district.name, searchQuery),
                    like(district.description, searchQuery),
                    like(district.code, searchQuery)
                )
            )
        ]);

        const total = totalResult[0]?.count || 0;
        const totalPages = Math.ceil(total / pageSize);

        return {
            success: true,
            data: districts,
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
            }
        };
    } catch (error) {
        console.error("Error searching districts:", error);
        throw new Error("Failed to search districts");
    }
}

export async function getDetail(id: string) {
    try {
        const result = await db.select().from(district)
            .leftJoin(regency, eq(regency.id, district.regencyId))
            .where(eq(district.id, id));

        if (result.length === 0) {
            throw new Error("District not found");
        }

        return {
            success: true,
            data: result[0],
        };
    } catch (error) {
        console.error("Error fetching district:", error);
        throw new Error("Failed to fetch district");
    }
}

export async function deleteItem(id: string) {
    try {
        await db.delete(district).where(eq(district.id, id));

        revalidatePath("/dashboard/settings/district");
        return { success: true };
    } catch (error) {
        console.error("Error deleting district:", error);
        throw new Error("Failed to delete district");
    }
}
