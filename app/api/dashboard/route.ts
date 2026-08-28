import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/lib/audit";
import { logAuditEvent } from "@/lib/audit-context";
import { getDashboardDataForUser } from "@/lib/dashboard";
import { requirePermission } from "@/lib/rbac";

export async function GET() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await requirePermission("Dashboard", "READ", session.user.id);
        const data = await getDashboardDataForUser(session.user.id);
        await logAuditEvent({
            module: AUDIT_MODULES.DASHBOARD,
            action: AUDIT_ACTIONS[1],
            description: "Dashboard data accessed.",
        });
        return NextResponse.json(data);
    } catch (error) {
        if (error instanceof Error && error.name === "AuthorizationError") {
            return NextResponse.json({ error: error.message }, { status: error instanceof Error && "status" in error ? Number((error as { status: number }).status) : 403 });
        }
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Dashboard data unavailable." },
            { status: 500 },
        );
    }
}
