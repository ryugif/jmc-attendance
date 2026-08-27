"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, count, desc, eq, inArray, like, or, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { department, district, employee, employeeEducation, province, regency } from "@/lib/schema";

export type EmployeePosition = "Manager" | "Staff" | "Intern";
export type EmployeeMaritalStatus = "Married" | "Not Married";
export type EmployeeStatus = "Active" | "Inactive";
export type EmployeeContractStatus = "Permanent" | "Contract" | "Internship" | "Probation";

export type EmployeeEducationInput = {
    id?: string;
    level: string;
    schoolName: string;
    graduationYear: number;
};

export async function getDepartmentOptions() {
    return await db
        .select({ id: department.id, name: department.name })
        .from(department)
        .where(eq(department.isActive, true))
        .orderBy(desc(department.name));
}

export async function getProvinceOptions(search = "") {
    const normalized = search.trim();
    const clauses = [] as ReturnType<typeof or>[];

    if (normalized) {
        clauses.push(like(province.name, `%${normalized}%`));
    }

    return await db
        .select({ id: province.id, name: province.name })
        .from(province)
        .where(clauses.length > 0 ? or(...clauses) : undefined)
        .orderBy(desc(province.name));
}

export async function getRegencyOptions(provinceId: string, search = "") {
    const normalized = search.trim();
    const clauses = [eq(regency.provinceId, provinceId)] as ReturnType<typeof and>[];

    if (normalized) {
        clauses.push(like(regency.name, `%${normalized}%`));
    }

    return await db
        .select({ id: regency.id, name: regency.name })
        .from(regency)
        .where(and(...clauses))
        .orderBy(desc(regency.name));
}

export async function getDistrictOptions(regencyId: string, search = "") {
    const normalized = search.trim();
    const clauses = [eq(district.regencyId, regencyId)] as ReturnType<typeof and>[];

    if (normalized) {
        clauses.push(like(district.name, `%${normalized}%`));
    }

    return await db
        .select({ id: district.id, name: district.name })
        .from(district)
        .where(and(...clauses))
        .orderBy(desc(district.name));
}

export async function searchDistricts(query: string, limit = 10) {
    const normalized = query.trim();

    if (normalized.length < 3) {
        return [];
    }

    const searchQuery = `%${normalized}%`;

    const rows = await db
        .select({
            id: district.id,
            districtName: district.name,
            regencyId: regency.id,
            regencyName: regency.name,
            provinceId: province.id,
            provinceName: province.name,
        })
        .from(district)
        .leftJoin(regency, eq(district.regencyId, regency.id))
        .leftJoin(province, eq(regency.provinceId, province.id))
        .where(like(district.name, searchQuery))
        .orderBy(desc(district.name))
        .limit(limit);

    return rows;
}

function calculateAge(dateOfBirth: string | Date | null | undefined) {
    if (!dateOfBirth) {
        return 0;
    }

    const birthDate = dateOfBirth instanceof Date ? new Date(dateOfBirth) : new Date(dateOfBirth);

    if (Number.isNaN(birthDate.getTime())) {
        return 0;
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age -= 1;
    }

    return Math.max(age, 0);
}

function normalizeEmployeeEducation(education: EmployeeEducationInput[] = []) {
    return education
        .filter((item) => item && item.level && item.schoolName && Number(item.graduationYear) > 0)
        .map((item) => ({
            level: item.level.trim(),
            schoolName: item.schoolName.trim(),
            graduationYear: Number(item.graduationYear),
        }));
}

function toDbDate(value: string | Date | null | undefined) {
    if (!value) {
        return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

export async function createEmployee(data: {
    nip: string;
    name: string;
    email: string;
    phoneNumber: string;
    photoUrl?: string;
    placeOfBirth: string;
    districtId?: string | null;
    districtName: string;
    regencyId?: string | null;
    regencyName: string;
    provinceId?: string | null;
    provinceName: string;
    fullAddress: string;
    homeToOfficeDistance: number;
    dateOfBirth: string;
    maritalStatus: EmployeeMaritalStatus;
    numberOfChildren: number;
    joinDate: string;
    position: EmployeePosition;
    departmentId: string;
    contractStatus: EmployeeContractStatus;
    status: EmployeeStatus;
    education: EmployeeEducationInput[];
}) {
    const nip = data.nip;
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const phoneNumber = data.phoneNumber.trim();
    const placeOfBirth = data.placeOfBirth.trim();
    const fullAddress = data.fullAddress.trim();
    const districtName = data.districtName.trim();
    const regencyName = data.regencyName.trim();
    const provinceName = data.provinceName.trim();
    const normalizedEducation = normalizeEmployeeEducation(data.education);

    if (!nip || !/^\d{8,}$/.test(nip)) {
        throw new Error("NIP is required, must contain at least 8 numeric characters, and cannot contain spaces.");
    }

    if (!name || !/^[A-Za-z0-9' ]+$/.test(name)) {
        throw new Error("Employee name can only contain letters, numbers, apostrophes, and spaces.");
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Email is required and must be valid.");
    }

    if (!phoneNumber || !/^\+[1-9]\d{7,14}$/.test(phoneNumber)) {
        throw new Error("Phone number must use international format, for example +6282218458888.");
    }

    if (!placeOfBirth) {
        throw new Error("Place of birth is required.");
    }

    if (!districtName || districtName.length < 3) {
        throw new Error("District is required and must be selected from the search results.");
    }

    if (!regencyName || !provinceName) {
        throw new Error("Regency and province must be selected automatically from the chosen district.");
    }

    if (!fullAddress) {
        throw new Error("Full address is required.");
    }

    if (!Number.isFinite(Number(data.homeToOfficeDistance)) || Number(data.homeToOfficeDistance) < 0 || Number(data.homeToOfficeDistance) > 99) {
        throw new Error("Home-to-office distance must be a valid number with a maximum of 2 digits.");
    }

    if (!data.dateOfBirth || Number.isNaN(new Date(data.dateOfBirth).getTime())) {
        throw new Error("Date of birth is required and must be valid.");
    }

    if (!data.joinDate || Number.isNaN(new Date(data.joinDate).getTime())) {
        throw new Error("Join date is required and must be valid.");
    }

    if (!data.departmentId) {
        throw new Error("Department is required.");
    }

    if (normalizedEducation.length === 0) {
        throw new Error("At least one education record is required.");
    }

    const [existingEmployee] = await db
        .select({ id: employee.id })
        .from(employee)
        .where(eq(employee.nip, nip))
        .limit(1);

    if (existingEmployee) {
        throw new Error("An employee with this NIP already exists.");
    }

    const employeeId = randomUUID();
    const employeeAge = calculateAge(data.dateOfBirth);
    const dateOfBirthValue = toDbDate(data.dateOfBirth);
    const joinDateValue = toDbDate(data.joinDate);

    if (!dateOfBirthValue || !joinDateValue) {
        throw new Error("Date of birth and join date must be valid dates.");
    }

    await db.insert(employee).values({
        id: employeeId,
        nip,
        name,
        email,
        phoneNumber,
        photoUrl: data.photoUrl || null,
        placeOfBirth,
        districtId: data.districtId || null,
        districtName,
        regencyId: data.regencyId || null,
        regencyName,
        provinceId: data.provinceId || null,
        provinceName,
        fullAddress,
        homeToOfficeDistance: Number(data.homeToOfficeDistance),
        dateOfBirth: dateOfBirthValue,
        age: employeeAge,
        maritalStatus: data.maritalStatus,
        numberOfChildren: Number(data.numberOfChildren || 0),
        joinDate: joinDateValue,
        position: data.position,
        departmentId: data.departmentId,
        contractStatus: data.contractStatus,
        status: data.status,
    });

    if (normalizedEducation.length > 0) {
        await db.insert(employeeEducation).values(
            normalizedEducation.map((item) => ({
                id: randomUUID(),
                employeeId,
                level: item.level,
                schoolName: item.schoolName,
                graduationYear: item.graduationYear,
            })),
        );
    }

    revalidatePath("/dashboard/employees");
    return { success: true, id: employeeId };
}

export async function updateEmployee(
    id: string,
    data: {
        nip?: string;
        name?: string;
        email?: string;
        phoneNumber?: string;
        photoUrl?: string;
        placeOfBirth?: string;
        districtId?: string | null;
        districtName?: string;
        regencyId?: string | null;
        regencyName?: string;
        provinceId?: string | null;
        provinceName?: string;
        fullAddress?: string;
        homeToOfficeDistance?: number;
        dateOfBirth?: string;
        maritalStatus?: EmployeeMaritalStatus;
        numberOfChildren?: number;
        joinDate?: string;
        position?: EmployeePosition;
        departmentId?: string;
        contractStatus?: EmployeeContractStatus;
        status?: EmployeeStatus;
        education?: EmployeeEducationInput[];
    },
) {
    const [existing] = await db.select().from(employee).where(eq(employee.id, id)).limit(1);

    if (!existing) {
        throw new Error("Employee not found.");
    }

    const nextNip = data.nip ?? existing.nip;
    const nextName = (data.name ?? existing.name).trim();
    const nextEmail = (data.email ?? existing.email).trim().toLowerCase();
    const nextPhone = (data.phoneNumber ?? existing.phoneNumber).trim();
    const nextPlaceOfBirth = (data.placeOfBirth ?? existing.placeOfBirth).trim();
    const nextDistrictName = (data.districtName ?? existing.districtName).trim();
    const nextRegencyName = (data.regencyName ?? existing.regencyName).trim();
    const nextProvinceName = (data.provinceName ?? existing.provinceName).trim();
    const nextAddress = (data.fullAddress ?? existing.fullAddress).trim();
    const nextJoinDate = data.joinDate ?? existing.joinDate;
    const nextDateOfBirth = data.dateOfBirth ?? existing.dateOfBirth;
    const nextEducation = normalizeEmployeeEducation(data.education ?? []);
    const nextDateOfBirthValue = toDbDate(nextDateOfBirth);
    const nextJoinDateValue = toDbDate(nextJoinDate);

    if (!nextNip || !/^\d{8,}$/.test(nextNip)) {
        throw new Error("NIP is required, must contain at least 8 numeric characters, and cannot contain spaces.");
    }

    if (!nextName || !/^[A-Za-z0-9' ]+$/.test(nextName)) {
        throw new Error("Employee name can only contain letters, numbers, apostrophes, and spaces.");
    }

    if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
        throw new Error("Email is required and must be valid.");
    }

    if (!nextPhone || !/^\+[1-9]\d{7,14}$/.test(nextPhone)) {
        throw new Error("Phone number must use international format, for example +6282218458888.");
    }

    if (!nextPlaceOfBirth) {
        throw new Error("Place of birth is required.");
    }

    if (!nextDistrictName || nextDistrictName.length < 3) {
        throw new Error("District is required and must be selected from the search results.");
    }

    if (!nextRegencyName || !nextProvinceName) {
        throw new Error("Regency and province are required.");
    }

    if (!nextAddress) {
        throw new Error("Full address is required.");
    }

    if (!nextDateOfBirthValue) {
        throw new Error("Date of birth is required and must be valid.");
    }

    if (!nextJoinDateValue) {
        throw new Error("Join date is required and must be valid.");
    }

    if (nextEducation.length === 0) {
        throw new Error("At least one education record is required.");
    }

    const nextAge = calculateAge(nextDateOfBirth);

    await db.update(employee)
        .set({
            nip: nextNip,
            name: nextName,
            email: nextEmail,
            phoneNumber: nextPhone,
            photoUrl: data.photoUrl !== undefined ? data.photoUrl || null : existing.photoUrl,
            placeOfBirth: nextPlaceOfBirth,
            districtId: data.districtId ?? existing.districtId,
            districtName: nextDistrictName,
            regencyId: data.regencyId ?? existing.regencyId,
            regencyName: nextRegencyName,
            provinceId: data.provinceId ?? existing.provinceId,
            provinceName: nextProvinceName,
            fullAddress: nextAddress,
            homeToOfficeDistance: data.homeToOfficeDistance ?? existing.homeToOfficeDistance,
            dateOfBirth: nextDateOfBirthValue,
            age: nextAge,
            maritalStatus: data.maritalStatus ?? existing.maritalStatus,
            numberOfChildren: data.numberOfChildren ?? existing.numberOfChildren,
            joinDate: nextJoinDateValue,
            position: data.position ?? existing.position,
            departmentId: data.departmentId ?? existing.departmentId,
            contractStatus: data.contractStatus ?? existing.contractStatus,
            status: data.status ?? existing.status,
            updatedAt: new Date(),
        })
        .where(eq(employee.id, id));

    if (data.education) {
        await db.delete(employeeEducation).where(eq(employeeEducation.employeeId, id));

        if (nextEducation.length > 0) {
            await db.insert(employeeEducation).values(
                nextEducation.map((item) => ({
                    id: randomUUID(),
                    employeeId: id,
                    level: item.level,
                    schoolName: item.schoolName,
                    graduationYear: item.graduationYear,
                })),
            );
        }
    }

    revalidatePath("/dashboard/employees");
    return { success: true };
}

export async function getEmployeeList(
    page = 1,
    pageSize = 10,
    filters: {
        search?: string;
        position?: string[];
        minLengthOfService?: number;
        maxLengthOfService?: number;
        contractStatus?: string;
    } = {},
) {
    const offset = (page - 1) * pageSize;
    const search = filters.search?.trim() || "";
    const whereClauses = [] as ReturnType<typeof and>[];

    if (search) {
        const fuzzySearch = `%${search}%`;
        whereClauses.push(
            or(
                like(employee.name, fuzzySearch),
                like(employee.nip, fuzzySearch),
                like(employee.position, fuzzySearch),
            ),
        );
    }

    if (filters.position && filters.position.length > 0) {
        whereClauses.push(inArray(employee.position, filters.position as EmployeePosition[]));
    }

    if (filters.contractStatus) {
        whereClauses.push(eq(employee.contractStatus, filters.contractStatus as EmployeeContractStatus));
    }

    const yearsOfServiceCondition = sql<number>`TIMESTAMPDIFF(YEAR, ${employee.joinDate}, CURDATE())`;

    if (typeof filters.minLengthOfService === "number") {
        whereClauses.push(sql`${yearsOfServiceCondition} >= ${filters.minLengthOfService}`);
    }

    if (typeof filters.maxLengthOfService === "number") {
        whereClauses.push(sql`${yearsOfServiceCondition} <= ${filters.maxLengthOfService}`);
    }

    const [rows, totalResult] = await Promise.all([
        db
            .select({
                id: employee.id,
                nip: employee.nip,
                name: employee.name,
                email: employee.email,
                phoneNumber: employee.phoneNumber,
                photoUrl: employee.photoUrl,
                placeOfBirth: employee.placeOfBirth,
                districtName: employee.districtName,
                regencyName: employee.regencyName,
                provinceName: employee.provinceName,
                fullAddress: employee.fullAddress,
                homeToOfficeDistance: employee.homeToOfficeDistance,
                dateOfBirth: employee.dateOfBirth,
                age: employee.age,
                maritalStatus: employee.maritalStatus,
                numberOfChildren: employee.numberOfChildren,
                joinDate: employee.joinDate,
                departmentId: employee.departmentId,
                departmentName: department.name,
                position: employee.position,
                contractStatus: employee.contractStatus,
                status: employee.status,
                createdAt: employee.createdAt,
                lengthOfService: sql<number>`TIMESTAMPDIFF(YEAR, ${employee.joinDate}, CURDATE())`,
            })
            .from(employee)
            .leftJoin(department, eq(employee.departmentId, department.id))
            .where(whereClauses.length > 0 ? and(...whereClauses) : undefined)
            .orderBy(desc(employee.createdAt))
            .limit(pageSize)
            .offset(offset),
        db
            .select({ count: count() })
            .from(employee)
            .where(whereClauses.length > 0 ? and(...whereClauses) : undefined),
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
        success: true,
        data: rows,
        pagination: {
            page,
            pageSize,
            total,
            totalPages,
        },
    };
}

export async function getEmployeeDetail(id: string) {
    const [employeeRecord] = await db
        .select({
            id: employee.id,
            nip: employee.nip,
            name: employee.name,
            email: employee.email,
            phoneNumber: employee.phoneNumber,
            photoUrl: employee.photoUrl,
            placeOfBirth: employee.placeOfBirth,
            districtId: employee.districtId,
            districtName: employee.districtName,
            regencyId: employee.regencyId,
            regencyName: employee.regencyName,
            provinceId: employee.provinceId,
            provinceName: employee.provinceName,
            fullAddress: employee.fullAddress,
            homeToOfficeDistance: employee.homeToOfficeDistance,
            dateOfBirth: employee.dateOfBirth,
            age: employee.age,
            maritalStatus: employee.maritalStatus,
            numberOfChildren: employee.numberOfChildren,
            joinDate: employee.joinDate,
            departmentId: employee.departmentId,
            departmentName: department.name,
            position: employee.position,
            contractStatus: employee.contractStatus,
            status: employee.status,
            createdAt: employee.createdAt,
            lengthOfService: sql<number>`TIMESTAMPDIFF(YEAR, ${employee.joinDate}, CURDATE())`,
        })
        .from(employee)
        .leftJoin(department, eq(employee.departmentId, department.id))
        .where(eq(employee.id, id))
        .limit(1);

    if (!employeeRecord) {
        throw new Error("Employee not found.");
    }

    const educationRecords = await db
        .select({
            id: employeeEducation.id,
            level: employeeEducation.level,
            schoolName: employeeEducation.schoolName,
            graduationYear: employeeEducation.graduationYear,
        })
        .from(employeeEducation)
        .where(eq(employeeEducation.employeeId, id))
        .orderBy(desc(employeeEducation.graduationYear));

    return {
        success: true,
        data: {
            ...employeeRecord,
            education: educationRecords,
        },
    };
}

export async function deleteEmployee(id: string) {
    await db.delete(employee).where(eq(employee.id, id));
    revalidatePath("/dashboard/employees");
    return { success: true };
}

export async function bulkDeleteEmployees(ids: string[]) {
    if (!ids.length) {
        return { success: true };
    }

    await db.delete(employee).where(inArray(employee.id, ids));
    revalidatePath("/dashboard/employees");
    return { success: true };
}

export async function bulkUpdateEmployeeStatus(ids: string[], status: EmployeeStatus) {
    if (!ids.length) {
        return { success: true };
    }

    await db.update(employee).set({ status, updatedAt: new Date() }).where(inArray(employee.id, ids));
    revalidatePath("/dashboard/employees");
    return { success: true };
}
