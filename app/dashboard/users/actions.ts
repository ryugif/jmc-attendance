"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, count, desc, eq, like, or } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { authSchema, department, jobPosition, role, user, userRole } from "@/lib/schema";

export async function getRoleOptions() {
    return await db.select({ id: role.id, name: role.name }).from(role).orderBy(desc(role.name));
}

export async function getDepartmentOptions() {
    return await db
        .select({ id: department.id, name: department.name })
        .from(department)
        .where(eq(department.isActive, true))
        .orderBy(desc(department.name));
}

export async function getJobPositionOptions() {
    return await db
        .select({ id: jobPosition.id, name: jobPosition.name, departmentId: jobPosition.departmentId })
        .from(jobPosition)
        .where(eq(jobPosition.isActive, true))
        .orderBy(desc(jobPosition.name));
}

export async function create(data: {
    name: string;
    email: string;
    username: string;
    password: string;
    phoneNumber?: string;
    roleId?: string | null;
    departmentId?: string | null;
    jobPositionId?: string | null;
    employeeCode?: string;
    isActive?: boolean;
}) {
    try {
        const email = data.email.trim().toLowerCase();
        const name = data.name.trim();
        const username = data.username.trim();
        const phoneNumber = data.phoneNumber?.trim() || undefined;

        if (!name) {
            throw new Error("Full name is required.");
        }

        if (!email) {
            throw new Error("Email is required.");
        }

        if (!username) {
            throw new Error("Username is required.");
        }

        if (!data.password || data.password.length < 8) {
            throw new Error("Password must be at least 8 characters long.");
        }

        const [existingEmail] = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.email, email))
            .limit(1);

        if (existingEmail) {
            throw new Error("A user with this email already exists.");
        }

        const [existingUsername] = await db
            .select({ id: user.id })
            .from(user)
            .where(eq(user.username, username))
            .limit(1);

        if (existingUsername) {
            throw new Error("This username is already in use.");
        }

        const signUp = await auth.api.signUpEmail({
            body: {
                email,
                name,
                username,
                password: data.password,
                phoneNumber,
            },
        });

        const userId = signUp.user.id;
        const normalizedRoleId = data.roleId || null;
        const normalizedDepartmentId = data.departmentId || null;
        const normalizedJobPositionId = data.jobPositionId || null;

        await db
            .update(authSchema.user)
            .set({
                roleId: normalizedRoleId,
                departmentId: normalizedDepartmentId,
                jobPositionId: normalizedJobPositionId,
                employeeCode: data.employeeCode?.trim() || null,
                isActive: data.isActive ?? true,
                phoneNumber: phoneNumber ?? null,
                updatedAt: new Date(),
            })
            .where(eq(authSchema.user.id, userId));

        if (normalizedRoleId) {
            const existingAssignment = await db
                .select()
                .from(userRole)
                .where(and(eq(userRole.userId, userId), eq(userRole.roleId, normalizedRoleId)))
                .limit(1);

            if (existingAssignment.length === 0) {
                await db.insert(userRole).values({
                    id: randomUUID(),
                    userId,
                    roleId: normalizedRoleId,
                });
            }
        }

        revalidatePath("/dashboard/users");
        return { success: true, id: userId };
    } catch (error) {
        console.error("Error creating user:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("Failed to create user.");
    }
}

export async function update(id: string, data: {
    name?: string;
    email?: string;
    username?: string;
    phoneNumber?: string;
    roleId?: string | null;
    departmentId?: string | null;
    jobPositionId?: string | null;
    employeeCode?: string;
    isActive?: boolean;
}) {
    try {
        const existing = await db.select().from(user).where(eq(user.id, id)).limit(1);
        if (existing.length === 0) {
            throw new Error("User not found.");
        }

        const current = existing[0];
        const nextName = data.name?.trim() || current.name;
        const nextEmail = data.email?.trim().toLowerCase() || current.email;
        const nextUsername = data.username?.trim() || current.username;
        const nextPhone = data.phoneNumber?.trim() || current.phoneNumber || null;

        if (nextEmail !== current.email) {
            const [emailConflict] = await db
                .select({ id: user.id })
                .from(user)
                .where(and(eq(user.email, nextEmail), eq(user.id, id)))
                .limit(1);

            if (emailConflict && emailConflict.id !== id) {
                throw new Error("A user with this email already exists.");
            }
        }

        if (nextUsername !== current.username) {
            const [usernameConflict] = await db
                .select({ id: user.id })
                .from(user)
                .where(and(eq(user.username, nextUsername), eq(user.id, id)))
                .limit(1);

            if (usernameConflict && usernameConflict.id !== id) {
                throw new Error("This username is already in use.");
            }
        }

        await db
            .update(authSchema.user)
            .set({
                name: nextName,
                email: nextEmail,
                username: nextUsername,
                phoneNumber: nextPhone,
                roleId: data.roleId ?? current.roleId,
                departmentId: data.departmentId ?? current.departmentId,
                jobPositionId: data.jobPositionId ?? current.jobPositionId,
                employeeCode: data.employeeCode !== undefined ? data.employeeCode.trim() || null : current.employeeCode,
                isActive: data.isActive ?? current.isActive,
                updatedAt: new Date(),
            })
            .where(eq(authSchema.user.id, id));

        if (data.roleId !== undefined) {
            await db.delete(userRole).where(eq(userRole.userId, id));
            if (data.roleId) {
                await db.insert(userRole).values({
                    id: randomUUID(),
                    userId: id,
                    roleId: data.roleId,
                });
            }
        }

        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        console.error("Error updating user:", error);
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("Failed to update user.");
    }
}

export async function getList(page: number = 1, pageSize: number = 10) {
    try {
        const offset = (page - 1) * pageSize;

        const [users, totalResult] = await Promise.all([
            db
                .select({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    phoneNumber: user.phoneNumber,
                    employeeCode: user.employeeCode,
                    isActive: user.isActive,
                    roleId: user.roleId,
                    departmentId: user.departmentId,
                    jobPositionId: user.jobPositionId,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    roleName: role.name,
                    departmentName: department.name,
                    jobPositionName: jobPosition.name,
                })
                .from(user)
                .leftJoin(role, eq(user.roleId, role.id))
                .leftJoin(department, eq(user.departmentId, department.id))
                .leftJoin(jobPosition, eq(user.jobPositionId, jobPosition.id))
                .orderBy(desc(user.createdAt))
                .limit(pageSize)
                .offset(offset),
            db.select({ count: count() }).from(user),
        ]);

        const total = totalResult[0]?.count || 0;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));

        return {
            success: true,
            data: users,
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
            },
        };
    } catch (error) {
        console.error("Error fetching users:", error);
        throw new Error("Failed to fetch users.");
    }
}

export async function search(query: string, page: number = 1, pageSize: number = 10) {
    try {
        const offset = (page - 1) * pageSize;
        const searchQuery = `%${query.trim()}%`;

        const [users, totalResult] = await Promise.all([
            db
                .select({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    phoneNumber: user.phoneNumber,
                    employeeCode: user.employeeCode,
                    isActive: user.isActive,
                    roleId: user.roleId,
                    departmentId: user.departmentId,
                    jobPositionId: user.jobPositionId,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                    roleName: role.name,
                    departmentName: department.name,
                    jobPositionName: jobPosition.name,
                })
                .from(user)
                .leftJoin(role, eq(user.roleId, role.id))
                .leftJoin(department, eq(user.departmentId, department.id))
                .leftJoin(jobPosition, eq(user.jobPositionId, jobPosition.id))
                .where(
                    or(
                        like(user.name, searchQuery),
                        like(user.email, searchQuery),
                        like(user.username, searchQuery),
                        like(user.employeeCode, searchQuery),
                        like(role.name, searchQuery),
                    ),
                )
                .orderBy(desc(user.createdAt))
                .limit(pageSize)
                .offset(offset),
            db
                .select({ count: count() })
                .from(user)
                .leftJoin(role, eq(user.roleId, role.id))
                .where(
                    or(
                        like(user.name, searchQuery),
                        like(user.email, searchQuery),
                        like(user.username, searchQuery),
                        like(user.employeeCode, searchQuery),
                        like(role.name, searchQuery),
                    ),
                ),
        ]);

        const total = totalResult[0]?.count || 0;
        const totalPages = Math.max(1, Math.ceil(total / pageSize));

        return {
            success: true,
            data: users,
            pagination: {
                page,
                pageSize,
                total,
                totalPages,
            },
        };
    } catch (error) {
        console.error("Error searching users:", error);
        throw new Error("Failed to search users.");
    }
}

export async function getDetail(id: string) {
    try {
        const [record] = await db
            .select({
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.username,
                phoneNumber: user.phoneNumber,
                employeeCode: user.employeeCode,
                isActive: user.isActive,
                roleId: user.roleId,
                departmentId: user.departmentId,
                jobPositionId: user.jobPositionId,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                roleName: role.name,
                departmentName: department.name,
                jobPositionName: jobPosition.name,
            })
            .from(user)
            .leftJoin(role, eq(user.roleId, role.id))
            .leftJoin(department, eq(user.departmentId, department.id))
            .leftJoin(jobPosition, eq(user.jobPositionId, jobPosition.id))
            .where(eq(user.id, id))
            .limit(1);

        if (!record) {
            throw new Error("User not found.");
        }

        return {
            success: true,
            data: record,
        };
    } catch (error) {
        console.error("Error fetching user:", error);
        if (error instanceof Error && error.message === "User not found.") {
            throw error;
        }
        throw new Error("Failed to fetch user.");
    }
}

export async function deleteItem(id: string) {
    try {
        await db.delete(user).where(eq(user.id, id));
        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new Error("Failed to delete user.");
    }
}
