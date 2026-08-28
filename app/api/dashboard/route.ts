import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/lib/audit";
import { logAuditEvent } from "@/lib/audit-context";
import { getDashboardDataForUser } from "@/lib/dashboard";
import { getUserRoleNameByUserId } from "@/lib/rbac";

export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleName = await getUserRoleNameByUserId(session.user.id);

    if (roleName !== "HRD Manager") {
        return NextResponse.json(
            { error: "Forbidden: Dashboard data is restricted to HR Manager role." },
            { status: 403 },
        );
    }

    try {
        const data = await getDashboardDataForUser(session.user.id);
        await logAuditEvent({
            module: AUDIT_MODULES.DASHBOARD,
            action: AUDIT_ACTIONS[1],
            description: "Dashboard data accessed.",
        });
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Dashboard data unavailable." },
            { status: 500 },
        );
    }
}
