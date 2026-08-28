import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/lib/audit";
import { logAuditEvent } from "@/lib/audit-context";
import { getAttendanceSummary, getDefaultAttendancePeriod } from "@/lib/attendance";

export async function GET(request: Request) {
    const headerStore = await headers();
    const { searchParams } = new URL(request.url);
    const defaultPeriod = await getDefaultAttendancePeriod();
    const year = Number(searchParams.get("year") ?? defaultPeriod.year);
    const month = Number(searchParams.get("month") ?? defaultPeriod.month);

    const data = await getAttendanceSummary(year, month);

    const session = await auth.api.getSession({
        headers: headerStore,
    });

    if (session) {
        await logAuditEvent({
            module: AUDIT_MODULES.ATTENDANCE,
            action: AUDIT_ACTIONS[1],
            description: "Attendance summary accessed.",
            metadata: { year, month },
        });
    }

    return NextResponse.json(data);
}
