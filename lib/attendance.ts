"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { and, asc, desc, eq, gte, lte, type InferInsertModel } from "drizzle-orm";

import { evaluateAttendanceStatus, OFFICE_LOCATIONS } from "@/lib/attendance-logic";
import { db } from "@/lib/db";
import { attendance, employee } from "@/lib/schema";

export type AttendanceRecord = {
    id: string;
    employeeId: string;
    employeeName: string;
    attendanceDate: string | Date;
    attendanceType: "Present" | "Leave" | "Permission" | "Unpaid Leave";
    checkInTime: string | null;
    checkOutTime: string | null;
    checkInLocation: string | null;
    checkOutLocation: string | null;
    effectiveWorkingHours: number;
    status: "Fulfilled" | "Not Fulfilled";
    verification: "Approved" | "Rejected";
    verifier: "Lead" | "Manager" | "HRD";
    notes: string | null;
    createdAt: Date;
};

export async function getDefaultAttendancePeriod() {
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return {
        year: previousMonth.getFullYear(),
        month: previousMonth.getMonth() + 1,
    };
}

function toDisplayDate(value: string | Date | null | undefined) {
    if (!value) {
        return "-";
    }

    if (value instanceof Date) {
        return value.toISOString().slice(0, 10);
    }

    return value;
}

function normalizeAttendanceType(value?: string | null): AttendanceRecord["attendanceType"] {
    switch (value) {
        case "Leave":
            return "Leave";
        case "Permission":
            return "Permission";
        case "Unpaid Leave":
            return "Unpaid Leave";
        case "Present":
        default:
            return "Present";
    }
}

function normalizeStatus(value?: string | null): AttendanceRecord["status"] {
    return value === "Fulfilled" ? "Fulfilled" : "Not Fulfilled";
}

function normalizeVerification(value?: string | null): AttendanceRecord["verification"] {
    return value === "Rejected" ? "Rejected" : "Approved";
}

function normalizeVerifier(value?: string | null): AttendanceRecord["verifier"] {
    if (value === "Manager") {
        return "Manager";
    }

    if (value === "HRD") {
        return "HRD";
    }

    return "Lead";
}

function normalizeOfficeLocation(value?: string | null): (typeof OFFICE_LOCATIONS)[number] | null {
    if (!value) {
        return null;
    }

    return OFFICE_LOCATIONS.includes(value as (typeof OFFICE_LOCATIONS)[number])
        ? (value as (typeof OFFICE_LOCATIONS)[number])
        : null;
}

export async function getAttendanceSummary(year: number, month: number) {
    const defaultPeriod = await getDefaultAttendancePeriod();
    const targetYear = Number.isFinite(Number(year)) ? Number(year) : defaultPeriod.year;
    const targetMonth = Number.isFinite(Number(month)) ? Number(month) : defaultPeriod.month;

    const startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
    const endDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));

    const employees = await db
        .select({
            id: employee.id,
            name: employee.name,
            position: employee.position,
        })
        .from(employee)
        .orderBy(asc(employee.name));

    const rows = await db
        .select({
            id: attendance.id,
            employeeId: attendance.employeeId,
            attendanceDate: attendance.attendanceDate,
            attendanceType: attendance.attendanceType,
            checkInTime: attendance.checkInTime,
            checkOutTime: attendance.checkOutTime,
            checkInLocation: attendance.checkInLocation,
            checkOutLocation: attendance.checkOutLocation,
            effectiveWorkingHours: attendance.effectiveWorkingHours,
            status: attendance.status,
            verification: attendance.verification,
            verifier: attendance.verifier,
            notes: attendance.notes,
            createdAt: attendance.createdAt,
        })
        .from(attendance)
        .where(and(gte(attendance.attendanceDate, startDate), lte(attendance.attendanceDate, endDate)))
        .orderBy(desc(attendance.attendanceDate));

    const attendanceByEmployee = new Map<string, typeof rows>();
    for (const row of rows) {
        const list = attendanceByEmployee.get(row.employeeId) ?? [];
        list.push(row);
        attendanceByEmployee.set(row.employeeId, list);
    }

    return employees.map((employeeRow, index) => {
        const records = attendanceByEmployee.get(employeeRow.id) ?? [];
        const present = records.filter((record) => normalizeStatus(record.status) === "Fulfilled" && normalizeAttendanceType(record.attendanceType) === "Present").length;
        const leave = records.filter((record) => normalizeAttendanceType(record.attendanceType) === "Leave").length;
        const permission = records.filter((record) => normalizeAttendanceType(record.attendanceType) === "Permission").length;
        const unpaidLeave = records.filter((record) => normalizeAttendanceType(record.attendanceType) === "Unpaid Leave").length;

        return {
            no: index + 1,
            employeeId: employeeRow.id,
            name: employeeRow.name,
            position: employeeRow.position,
            present: Number(present.toFixed(1)),
            leave: Number(leave.toFixed(1)),
            leaveQuota: 0,
            permission: Number(permission.toFixed(1)),
            permissionQuota: 0,
            unpaidLeave: Number(unpaidLeave.toFixed(1)),
            unpaidLeaveQuota: 0,
            status: present >= 1 ? "Fulfilled" : "Not Fulfilled",
        };
    });
}

export async function getEmployeeAttendanceDetail(employeeId: string) {
    const [selectedEmployee] = await db
        .select({
            id: employee.id,
            name: employee.name,
        })
        .from(employee)
        .where(eq(employee.id, employeeId))
        .limit(1);

    if (!selectedEmployee) {
        throw new Error("Employee not found.");
    }

    const records = await db
        .select({
            id: attendance.id,
            employeeId: attendance.employeeId,
            attendanceDate: attendance.attendanceDate,
            attendanceType: attendance.attendanceType,
            checkInTime: attendance.checkInTime,
            checkOutTime: attendance.checkOutTime,
            checkInLocation: attendance.checkInLocation,
            checkOutLocation: attendance.checkOutLocation,
            effectiveWorkingHours: attendance.effectiveWorkingHours,
            status: attendance.status,
            verification: attendance.verification,
            verifier: attendance.verifier,
            notes: attendance.notes,
            createdAt: attendance.createdAt,
        })
        .from(attendance)
        .where(eq(attendance.employeeId, employeeId))
        .orderBy(desc(attendance.attendanceDate));

    return {
        employee: selectedEmployee,
        records: records.map((record) => {
            const durationValue = Number(record.effectiveWorkingHours ?? 0);

            return {
                id: record.id,
                employeeId: record.employeeId,
                date: toDisplayDate(record.attendanceDate),
                attendanceType: normalizeAttendanceType(record.attendanceType),
                checkInTime: record.checkInTime,
                checkOutTime: record.checkOutTime,
                checkInLocation: record.checkInLocation,
                checkOutLocation: record.checkOutLocation,
                duration: Number(durationValue.toFixed(1)),
                status: normalizeStatus(record.status),
                verification: normalizeVerification(record.verification),
                verifier: normalizeVerifier(record.verifier),
                notes: record.notes,
            };
        }),
    };
}

export async function createAttendanceRecord(input: {
    employeeId: string;
    attendanceDate: string;
    attendanceType?: string;
    checkInTime?: string | null;
    checkOutTime?: string | null;
    checkInLocation?: string | null;
    checkOutLocation?: string | null;
    verification?: string;
    verifier?: string;
    notes?: string | null;
}) {
    const employeeExists = await db
        .select({ id: employee.id })
        .from(employee)
        .where(eq(employee.id, input.employeeId))
        .limit(1);

    if (!employeeExists.length) {
        throw new Error("Employee not found.");
    }

    const attendanceDate = new Date(input.attendanceDate);
    if (Number.isNaN(attendanceDate.getTime())) {
        throw new Error("Attendance date is invalid.");
    }

    const evaluation = evaluateAttendanceStatus({
        checkInTime: input.checkInTime,
        checkOutTime: input.checkOutTime,
        checkInLocation: input.checkInLocation,
        checkOutLocation: input.checkOutLocation,
    });

    const nextType = normalizeAttendanceType(input.attendanceType ?? "Present");
    const nextStatus = nextType === "Present" ? evaluation.status : "Not Fulfilled";

    const id = randomUUID();
    const record: InferInsertModel<typeof attendance> = {
        id,
        employeeId: input.employeeId,
        attendanceDate,
        attendanceType: nextType,
        checkInTime: input.checkInTime ?? null,
        checkOutTime: input.checkOutTime ?? null,
        checkInLocation: normalizeOfficeLocation(input.checkInLocation),
        checkOutLocation: normalizeOfficeLocation(input.checkOutLocation),
        effectiveWorkingHours: String(Number(evaluation.effectiveWorkingHours.toFixed(1))),
        status: nextStatus,
        verification: normalizeVerification(input.verification ?? "Approved"),
        verifier: normalizeVerifier(input.verifier ?? "Lead"),
        notes: input.notes ?? null,
        isPresent: nextType === "Present",
    };

    await db.insert(attendance).values(record);

    revalidatePath("/dashboard/attendance");
    return { success: true, id };
}

export async function importAttendanceFile(file: File, year: number, month: number) {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
        throw new Error("The uploaded file is empty or missing attendance rows.");
    }

    const headers = lines[0].split(",").map((header) => header.trim().replace(/^"|"$/g, ""));
    const requiredHeaders = [
        "employeeId",
        "attendanceDate",
        "attendanceType",
        "checkInTime",
        "checkOutTime",
        "checkInLocation",
        "checkOutLocation",
    ];

    const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));
    if (missingHeaders.length > 0) {
        throw new Error(`Import file is missing required columns: ${missingHeaders.join(", ")}.`);
    }

    const rowCount = lines.length - 1;
    for (let index = 1; index < lines.length; index += 1) {
        const values = parseCsvLine(lines[index]);
        const row = Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));

        if (!row.employeeId || !row.attendanceDate) {
            continue;
        }

        await createAttendanceRecord({
            employeeId: row.employeeId,
            attendanceDate: row.attendanceDate,
            attendanceType: row.attendanceType,
            checkInTime: row.checkInTime || null,
            checkOutTime: row.checkOutTime || null,
            checkInLocation: row.checkInLocation || null,
            checkOutLocation: row.checkOutLocation || null,
            verification: row.verification || "Approved",
            verifier: row.verifier || "Lead",
            notes: row.notes || null,
        });
    }

    revalidatePath("/dashboard/attendance");
    return {
        success: true,
        processedRows: rowCount,
        year,
        month,
    };
}

function parseCsvLine(line: string) {
    const row: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const character = line[index];
        if (character === '"') {
            if (inQuotes && line[index + 1] === '"') {
                current += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (character === "," && !inQuotes) {
            row.push(current);
            current = "";
        } else {
            current += character;
        }
    }

    row.push(current);
    return row.map((value) => value.trim());
}

export async function getAttendanceTemplateCsv() {
    const headers = [
        "employeeId",
        "attendanceDate",
        "attendanceType",
        "checkInTime",
        "checkOutTime",
        "checkInLocation",
        "checkOutLocation",
        "verification",
        "verifier",
        "notes",
    ];

    return [headers.join(",")].join("\n");
}
