import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AuditLogClient from "./page-client";
import { auth } from "@/lib/auth";
import { getUserModulePermission } from "@/lib/rbac";

export default async function AuditLogPage() {
    const headerStore = await headers();
    const session = await auth.api.getSession({
        headers: headerStore,
    });

    if (!session) {
        redirect("/sign-in");
    }

    const permission = await getUserModulePermission(session.user.id, "log");
    if (!permission?.access || permission.read === "no") {
        redirect("/dashboard");
    }

    return <AuditLogClient />;
}
