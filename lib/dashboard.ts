import "server-only";

import { count, desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { getUserRoleRecordByUserId } from "@/lib/rbac";
import { employee } from "@/lib/schema";

export type DashboardEmployeeSummary = {
    id: string;
    name: string;
    joinDate: string;
    contractType: "PKWTT" | "PKWT";
};

export type DashboardStats = {
    totalEmployees: number;
    contractEmployees: number;
    permanentEmployees: number;
    interns: number;
};

export type DashboardGenderStats = {
    male: number;
    female: number;
};

export type DashboardData = {
    role: string;
    stats: DashboardStats;
    gender: DashboardGenderStats;
    recentEmployees: DashboardEmployeeSummary[];
};

function normalizeRoleName(roleName: string | null | undefined) {
    const normalized = (roleName ?? "User").trim();

    if (normalized === "Super Admin") {
        return "Superadmin";
    }

    if (normalized === "HRD Manager") {
        return "HR Manager";
    }

    if (normalized === "HRD Admin") {
        return "HR Admin";
    }

    return normalized || "User";
}

function mapContractType(contractStatus: string | null | undefined): "PKWTT" | "PKWT" {
    switch (contractStatus) {
        case "Permanent":
            return "PKWTT";
        case "Contract":
        case "Internship":
        case "Probation":
            return "PKWT";
        default:
            return "PKWT";
    }
}

export async function getDashboardDataForUser(userId: string): Promise<DashboardData> {
    const roleRecord = await getUserRoleRecordByUserId(userId);
    const roleName = normalizeRoleName(roleRecord?.name ?? "User");

    if (roleName === "Superadmin" || roleName === "HR Admin") {
        return {
            role: roleName,
            stats: {
                totalEmployees: 0,
                contractEmployees: 0,
                permanentEmployees: 0,
                interns: 0,
            },
            gender: {
                male: 0,
                female: 0,
            },
            recentEmployees: [],
        };
    }

    if (roleName !== "HR Manager") {
        return {
            role: roleName,
            stats: {
                totalEmployees: 0,
                contractEmployees: 0,
                permanentEmployees: 0,
                interns: 0,
            },
            gender: {
                male: 0,
                female: 0,
            },
            recentEmployees: [],
        };
    }

    const [totalEmployment, contractEmployment, permanentEmployment, internEmployment, genderCounts, recentEmployees] =
        await Promise.all([
            db
                .select({ count: count() })
                .from(employee),
            db
                .select({ count: count() })
                .from(employee)
                .where(eq(employee.contractStatus, "Contract")),
            db
                .select({ count: count() })
                .from(employee)
                .where(eq(employee.contractStatus, "Permanent")),
            db
                .select({ count: count() })
                .from(employee)
                .where(eq(employee.contractStatus, "Internship")),
            db
                .select({ gender: employee.gender, count: count() })
                .from(employee)
                .groupBy(employee.gender),
            db
                .select({
                    id: employee.id,
                    name: employee.name,
                    joinDate: employee.joinDate,
                    contractStatus: employee.contractStatus,
                })
                .from(employee)
                .orderBy(desc(employee.joinDate))
                .limit(5),
        ]);

    const gender = { male: 0, female: 0 };
    for (const row of genderCounts) {
        if (row.gender === "Male") {
            gender.male = Number(row.count);
        }

        if (row.gender === "Female") {
            gender.female = Number(row.count);
        }
    }

    const stats: DashboardStats = {
        totalEmployees: Number(totalEmployment[0]?.count ?? 0),
        contractEmployees: Number(contractEmployment[0]?.count ?? 0),
        permanentEmployees: Number(permanentEmployment[0]?.count ?? 0),
        interns: Number(internEmployment[0]?.count ?? 0),
    };

    return {
        role: roleName,
        stats,
        gender,
        recentEmployees: recentEmployees.map((row) => ({
            id: row.id,
            name: row.name,
            joinDate: row.joinDate instanceof Date ? row.joinDate.toISOString().slice(0, 10) : String(row.joinDate),
            contractType: mapContractType(row.contractStatus),
        })),
    };
}

export async function getDashboardDataForUserBySession(userId: string) {
    return getDashboardDataForUser(userId);
}
