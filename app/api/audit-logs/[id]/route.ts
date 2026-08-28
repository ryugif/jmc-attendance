import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getAuditLogById } from "@/lib/audit";
import { getUserModulePermission } from "@/lib/rbac";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const headerStore = await headers();
    const session = await auth.api.getSession({
        headers: headerStore,
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permission = await getUserModulePermission(session.user.id, "log");
    if (!permission?.access || permission.read === "no") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const data = await getAuditLogById(id);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unable to load audit log." },
            { status: 404 },
        );
    }
}
