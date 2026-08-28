import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { recordAuditLog, type AuditAction, type AuditModule } from "@/lib/audit";

export async function getAuditSession() {
    const headerStore = await headers();
    const session = await auth.api.getSession({
        headers: headerStore,
    });

    return {
        session,
        headers: headerStore,
    };
}

export async function getAuditActor() {
    const { session } = await getAuditSession();

    if (!session) {
        return null;
    }

    return {
        userId: session.user.id,
        userName: session.user.name || session.user.username || "User",
        ipAddress: session.session?.ipAddress ?? null,
        userAgent: session.session?.userAgent ?? null,
    };
}

export async function logAuditEvent(entry: {
    module: AuditModule | string;
    action: AuditAction;
    resourceId?: string | null;
    description?: string | null;
    metadata?: Record<string, unknown> | null;
}) {
    const actor = await getAuditActor();

    if (!actor) {
        return;
    }

    await recordAuditLog({
        ...actor,
        module: entry.module,
        action: entry.action,
        resourceId: entry.resourceId ?? null,
        description: entry.description ?? null,
        metadata: entry.metadata ?? null,
    });
}
