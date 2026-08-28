import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import GlobalHeader from "@/components/global-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { formatAuditAction, getAuditActionBadgeClass } from "@/lib/audit-helpers";
import { getAuditLogById } from "@/lib/audit";
import { getUserModulePermission } from "@/lib/rbac";

export default async function AuditLogDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
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

    const log = await getAuditLogById(id);

    return (
        <div className="space-y-6">
            <GlobalHeader title="Audit Log Detail" description="Inspect activity metadata and context." />

            <div className="flex justify-start">
                <Link href="/dashboard/log">
                    <Button variant="outline">Back to logs</Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{log.description || "Activity detail"}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    <Detail label="User" value={log.userName} />
                    <Detail label="Timestamp" value={new Date(log.createdAt).toLocaleString("id-ID")} />
                    <Detail label="Module" value={log.module} />
                    <Detail
                        label="Action"
                        value={<Badge className={getAuditActionBadgeClass(log.action)}>{formatAuditAction(log.action)}</Badge>}
                    />
                    <Detail label="Resource ID" value={log.resourceId || "-"} />
                    <Detail label="IP Address" value={log.ipAddress || "-"} />
                    <Detail label="User Agent" value={log.userAgent || "-"} />
                    <Detail label="Metadata" value={log.metadata ? <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(log.metadata, null, 2)}</pre> : "-"} />
                </CardContent>
            </Card>
        </div>
    );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="text-sm text-foreground">{value}</div>
        </div>
    );
}
