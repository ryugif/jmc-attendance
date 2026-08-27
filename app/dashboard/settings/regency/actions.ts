"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { eq, count, like, or } from "drizzle-orm";

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

        revalidatePath("/dashboard/settings/regency");
        return { success: true };
    } catch (error) {
        console.error("Error updating regency:", error);
        throw new Error("Failed to update regency");
    }
}

export async function getList(page: number = 1, pageSize: number = 10) {
    try {
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
        await db.delete(regency).where(eq(regency.id, id));

        revalidatePath("/dashboard/settings/regency");
        return { success: true };
    } catch (error) {
        console.error("Error deleting regency:", error);
        throw new Error("Failed to delete regency");
    }
}
