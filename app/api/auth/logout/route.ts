import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { AUDIT_ACTIONS, AUDIT_MODULES, recordAuditLog } from "@/lib/audit";

export async function POST() {
    const headerStore = await headers();
    const session = await auth.api.getSession({
        headers: headerStore,
    });

    if (session) {
        await recordAuditLog({
            userId: session.user.id,
            userName: session.user.name || session.user.username || "User",
            module: AUDIT_MODULES.LOG,
            action: AUDIT_ACTIONS[5],
            description: "User signed out.",
            ipAddress: session.session?.ipAddress ?? null,
            userAgent: session.session?.userAgent ?? null,
            metadata: {
                sessionId: session.session?.id,
            },
        });
    }

    const result = await auth.api.signOut({
        headers: headerStore,
    });

    return NextResponse.json(result);
}
