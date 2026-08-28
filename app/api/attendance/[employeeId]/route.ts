import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/lib/audit";
import { logAuditEvent } from "@/lib/audit-context";
import { getEmployeeAttendanceDetail } from "@/lib/attendance";

export async function GET(_request: Request, { params }: { params: Promise<{ employeeId: string }> }) {
    const { employeeId } = await params;
    const headerStore = await headers();

    try {
        const data = await getEmployeeAttendanceDetail(employeeId);

        const session = await auth.api.getSession({
            headers: headerStore,
        });

        if (session) {
            await logAuditEvent({
                module: AUDIT_MODULES.ATTENDANCE,
                action: AUDIT_ACTIONS[1],
                resourceId: employeeId,
                description: "Attendance detail accessed.",
            });
        }

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unable to load attendance detail." },
            { status: 400 },
        );
    }
}
