import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { department, district, jobPosition, province, regency } from "@/lib/schema";

export const MASTER_DATA_MODULES = [
    {
        slug: "province",
        label: "Province",
        description: "Province master data used in geographic assignments.",
    },
    {
        slug: "regency",
        label: "Regency",
        description: "Regency master data linked to a province.",
    },
    {
        slug: "district",
        label: "District",
        description: "District master data linked to a regency and province.",
    },
    {
        slug: "department",
        label: "Department",
        description: "Organization department master data.",
    },
    {
        slug: "job-position",
        label: "Job Position",
        description: "Job position master data linked to departments.",
    },
] as const;

export type MasterDataModuleSlug = (typeof MASTER_DATA_MODULES)[number]["slug"];

export function getMasterDataModule(slug: string) {
    return MASTER_DATA_MODULES.find((module) => module.slug === slug);
}

export async function getMasterDataRecords(slug: string) {
    switch (slug) {
        case "province":
            return await db
                .select()
                .from(province)
                .orderBy(desc(province.updatedAt));
        case "regency":
            return await db
                .select({
                    id: regency.id,
                    code: regency.code,
                    name: regency.name,
                    description: regency.description,
                    provinceId: regency.provinceId,
                    isActive: regency.isActive,
                    createdAt: regency.createdAt,
                    updatedAt: regency.updatedAt,
                    provinceName: province.name,
                })
                .from(regency)
                .leftJoin(province, eq(regency.provinceId, province.id))
                .orderBy(desc(regency.updatedAt));
        case "district":
            return await db
                .select({
                    id: district.id,
                    code: district.code,
                    name: district.name,
                    description: district.description,
                    regencyId: district.regencyId,
                    isActive: district.isActive,
                    createdAt: district.createdAt,
                    updatedAt: district.updatedAt,
                    regencyName: regency.name,
                    provinceName: province.name,
                })
                .from(district)
                .leftJoin(regency, eq(district.regencyId, regency.id))
                .leftJoin(province, eq(regency.provinceId, province.id))
                .orderBy(desc(district.updatedAt));
        case "department":
            return await db
                .select()
                .from(department)
                .orderBy(desc(department.updatedAt));
        case "job-position":
            return await db
                .select({
                    id: jobPosition.id,
                    code: jobPosition.code,
                    name: jobPosition.name,
                    description: jobPosition.description,
                    departmentId: jobPosition.departmentId,
                    isActive: jobPosition.isActive,
                    createdAt: jobPosition.createdAt,
                    updatedAt: jobPosition.updatedAt,
                    departmentName: department.name,
                })
                .from(jobPosition)
                .leftJoin(department, eq(jobPosition.departmentId, department.id))
                .orderBy(desc(jobPosition.updatedAt));
        default:
            return [];
    }
}

export async function getMasterDataOptions(slug: string) {
    switch (slug) {
        case "province":
            return await db.select().from(province).orderBy(desc(province.name));
        case "regency":
            return await db.select().from(regency).orderBy(desc(regency.name));
        case "district":
            return await db.select().from(district).orderBy(desc(district.name));
        case "department":
            return await db.select().from(department).orderBy(desc(department.name));
        default:
            return [];
    }
}

export function getDisplayFieldNames(moduleSlug: string) {
    switch (moduleSlug) {
        case "province":
            return ["code", "name", "description", "isActive", "createdAt", "updatedAt"];
        case "regency":
            return ["provinceName", "code", "name", "description", "isActive", "createdAt", "updatedAt"];
        case "district":
            return ["provinceName", "regencyName", "code", "name", "description", "isActive", "createdAt", "updatedAt"];
        case "department":
            return ["code", "name", "description", "isActive", "createdAt", "updatedAt"];
        case "job-position":
            return ["departmentName", "code", "name", "description", "isActive", "createdAt", "updatedAt"];
        default:
            return ["name", "createdAt", "updatedAt"];
    }
}

export async function getProvinceOptions() {
    return await db.select().from(province).orderBy(desc(province.name));
}

export async function getRegencyOptionsByProvince(provinceId: string | null) {
    if (!provinceId) {
        return [];
    }

    return await db
        .select()
        .from(regency)
        .where(eq(regency.provinceId, provinceId))
        .orderBy(desc(regency.name));
}
