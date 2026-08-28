"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, asc, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/lib/db";
import { attendance, employee, transportAllowanceResult, transportAllowanceSetting } from "@/lib/schema";

export type TransportAllowanceSettingRecord = {
    id: string;
    baseFare: number;
    minDistance: string | number | null;
    maxDistance: string | number | null;
    effectiveFrom: string | Date | null;
    createdAt: Date;
    updatedAt: Date;
};

export async function roundDistance(value: number): Promise<number> {
    if (!Number.isFinite(value)) return 0;
    return Math.round(value);
}

export async function listTransportAllowanceSettings() {
    const settings = await db
        .select()
        .from(transportAllowanceSetting)
        .orderBy(desc(transportAllowanceSetting.effectiveFrom));

    return settings;
}

export async function getTransportAllowanceSettingDetail(id: string) {
    const [record] = await db
        .select()
        .from(transportAllowanceSetting)
        .where(eq(transportAllowanceSetting.id, id))
        .limit(1);

    if (!record) {
        throw new Error("Transport allowance setting not found.");
    }

    return record;
}

export async function createTransportAllowanceSetting(input: {
    baseFare: number;
    minDistance: number;
    maxDistance: number;
    effectiveFrom: string;
}) {
    const baseFare = Number(input.baseFare);
    const minDistance = Number(input.minDistance);
    const maxDistance = Number(input.maxDistance);

    if (!Number.isFinite(baseFare) || baseFare <= 0) {
        throw new Error("Base fare must be numeric and greater than 0.");
    }

    if (!Number.isFinite(minDistance) || minDistance < 0) {
        throw new Error("Minimum kilometer must be numeric.");
    }

    if (!Number.isFinite(maxDistance) || maxDistance < 0) {
        throw new Error("Maximum kilometer must be numeric.");
    }

    if (minDistance > maxDistance) {
        throw new Error("Minimum kilometer must not be greater than maximum kilometer.");
    }

    if (!input.effectiveFrom) {
        throw new Error("Effective date is required.");
    }

    const effectiveDate = new Date(input.effectiveFrom);
    if (Number.isNaN(effectiveDate.getTime())) {
        throw new Error("Effective date is invalid.");
    }

    const id = randomUUID();
    await db.insert(transportAllowanceSetting).values({
        id,
        baseFare,
        minDistance: String(minDistance),
        maxDistance: String(maxDistance),
        effectiveFrom: effectiveDate,
    });

    revalidatePath("/dashboard/settings/transport-allowance");
    return { success: true, id };
}

export async function updateTransportAllowanceSetting(
    id: string,
    input: {
        baseFare?: number;
        minDistance?: number;
        maxDistance?: number;
        effectiveFrom?: string;
    },
) {
    const existing = await getTransportAllowanceSettingDetail(id);
    const nextBaseFare = Number(input.baseFare ?? existing.baseFare);
    const nextMinDistance = Number(input.minDistance ?? existing.minDistance ?? 0);
    const nextMaxDistance = Number(input.maxDistance ?? existing.maxDistance ?? 0);
    const nextEffectiveFrom = input.effectiveFrom ?? (existing.effectiveFrom as Date | string | null)?.toString();

    if (!Number.isFinite(nextBaseFare) || nextBaseFare <= 0) {
        throw new Error("Base fare must be numeric and greater than 0.");
    }

    if (!Number.isFinite(nextMinDistance) || nextMinDistance < 0) {
        throw new Error("Minimum kilometer must be numeric.");
    }

    if (!Number.isFinite(nextMaxDistance) || nextMaxDistance < 0) {
        throw new Error("Maximum kilometer must be numeric.");
    }

    if (nextMinDistance > nextMaxDistance) {
        throw new Error("Minimum kilometer must not be greater than maximum kilometer.");
    }

    if (!nextEffectiveFrom) {
        throw new Error("Effective date is required.");
    }

    const effectiveDate = new Date(nextEffectiveFrom);
    if (Number.isNaN(effectiveDate.getTime())) {
        throw new Error("Effective date is invalid.");
    }

    await db
        .update(transportAllowanceSetting)
        .set({
            baseFare: nextBaseFare,
            minDistance: String(nextMinDistance),
            maxDistance: String(nextMaxDistance),
            effectiveFrom: effectiveDate,
            updatedAt: new Date(),
        })
        .where(eq(transportAllowanceSetting.id, id));

    revalidatePath("/dashboard/settings/transport-allowance");
    return { success: true };
}

export async function deleteTransportAllowanceSetting(id: string) {
    await db.delete(transportAllowanceSetting).where(eq(transportAllowanceSetting.id, id));
    revalidatePath("/dashboard/settings/transport-allowance");
    return { success: true };
}

export async function getEffectiveTransportAllowanceSettingForMonth(year: number, month: number) {
    const monthDate = new Date(Date.UTC(year, month - 1, 1));
    const [record] = await db
        .select()
        .from(transportAllowanceSetting)
        .where(lte(transportAllowanceSetting.effectiveFrom, monthDate))
        .orderBy(desc(transportAllowanceSetting.effectiveFrom))
        .limit(1);

    if (!record) {
        throw new Error("No applicable transport allowance settings found for the selected month.");
    }

    return record;
}

export async function getMonthlyTransportAllowanceList(year: number) {
    const months = Array.from({ length: 12 }, (_, index) => index + 1);

    const data = await Promise.all(
        months.map(async (month) => {
            const rows = await db
                .select({
                    employeeId: transportAllowanceResult.employeeId,
                    amount: transportAllowanceResult.amount,
                })
                .from(transportAllowanceResult)
                .where(and(eq(transportAllowanceResult.year, year), eq(transportAllowanceResult.month, month)));

            const totalRecipients = new Set(rows.map((row) => row.employeeId)).size;
            const totalAllowance = rows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

            return {
                month,
                totalRecipients,
                totalAllowance,
            };
        }),
    );

    return data;
}

export async function getMonthlyTransportAllowanceDetail(year: number, month: number) {
    const rows = await db
        .select({
            id: transportAllowanceResult.id,
            employeeId: transportAllowanceResult.employeeId,
            name: employee.name,
            roundedDistance: transportAllowanceResult.roundedDistance,
            eligibleDistance: transportAllowanceResult.eligibleDistance,
            workingDays: transportAllowanceResult.workingDays,
            amount: transportAllowanceResult.amount,
        })
        .from(transportAllowanceResult)
        .leftJoin(employee, eq(transportAllowanceResult.employeeId, employee.id))
        .where(and(eq(transportAllowanceResult.year, year), eq(transportAllowanceResult.month, month)))
        .orderBy(asc(transportAllowanceResult.amount));

    return rows;
}

export async function calculateMonthlyAllowance(year: number, month: number) {
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        throw new Error("Year is invalid.");
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new Error("Month is invalid.");
    }

    const setting = await getEffectiveTransportAllowanceSettingForMonth(year, month);
    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const candidates = await db
        .select({
            id: employee.id,
            name: employee.name,
            distance: employee.homeToOfficeDistance,
            contractStatus: employee.contractStatus,
            status: employee.status,
        })
        .from(employee)
        .where(and(eq(employee.status, "Active"), eq(employee.contractStatus, "Permanent")));

    const results: Array<{
        employeeId: string;
        name: string;
        amount: number;
        roundedDistance: number;
        eligibleDistance: number;
        workingDays: number;
    }> = [];

    for (const candidate of candidates) {
        const attendanceRows = await db
            .select()
            .from(attendance)
            .where(
                and(
                    eq(attendance.employeeId, candidate.id),
                    gte(attendance.attendanceDate, startDate),
                    lte(attendance.attendanceDate, endDate),
                    eq(attendance.isPresent, true),
                ),
            );

        const workingDays = attendanceRows.length;
        const roundedDistance = await roundDistance(Number(candidate.distance ?? 0));

        if (workingDays < 19) {
            continue;
        }

        const minDistance = Number(setting.minDistance ?? 0);
        const maxDistance = Number(setting.maxDistance ?? 0);
        const hasEligibleDistance = roundedDistance > minDistance && roundedDistance <= maxDistance;
        const cappedDistance = hasEligibleDistance ? Math.min(roundedDistance, maxDistance) : 0;

        if (!hasEligibleDistance || cappedDistance <= 0) {
            continue;
        }

        const amount = Math.round((setting.baseFare ?? 0) * cappedDistance * workingDays);

        if (amount <= 0) {
            continue;
        }

        results.push({
            employeeId: candidate.id,
            name: candidate.name,
            amount,
            roundedDistance,
            eligibleDistance: cappedDistance,
            workingDays,
        });
    }

    await db.transaction(async (tx) => {
        await tx.delete(transportAllowanceResult).where(
            and(eq(transportAllowanceResult.year, year), eq(transportAllowanceResult.month, month)),
        );

        if (results.length === 0) {
            return;
        }

        await tx.insert(transportAllowanceResult).values(
            results.map((entry) => ({
                id: randomUUID(),
                employeeId: entry.employeeId,
                year,
                month,
                baseFare: setting.baseFare,
                roundedDistance: String(entry.roundedDistance),
                eligibleDistance: String(entry.eligibleDistance),
                workingDays: entry.workingDays,
                amount: entry.amount,
            })),
        );
    });

    revalidatePath("/dashboard/transport-allowance");
    revalidatePath(`/dashboard/transport-allowance/${year}/${month}`);

    return {
        success: true,
        year,
        month,
        produced: results.length,
        message: results.length > 0 ? `Calculated transport allowance for ${results.length} employees.` : "No eligible employees were found for this month.",
    };
}
