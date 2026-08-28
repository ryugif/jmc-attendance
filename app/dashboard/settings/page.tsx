import Link from "next/link";

import { MASTER_DATA_MODULES } from "@/lib/master-data";
import GlobalHeader from "@/components/global-header";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/lib/audit";
import { logAuditEvent } from "@/lib/audit-context";

export default async function SettingsPage() {
    await logAuditEvent({
        module: AUDIT_MODULES.SETTINGS,
        action: AUDIT_ACTIONS[1],
        description: "Settings overview accessed.",
    });

    return (
        <div className="space-y-6">
            <GlobalHeader title="Master Data" description="Manage shared reference data used across employee and organization records." />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {MASTER_DATA_MODULES.map((module) => (
                    <Link
                        key={module.slug}
                        href={`/dashboard/settings/${module.slug}`}
                        className="group rounded-xl border border-zinc-200 bg-zinc-50 p-5 transition hover:border-violet-300 hover:bg-violet-50"
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <span className="text-lg font-semibold text-zinc-900">{module.label}</span>
                            <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700">
                                Master
                            </span>
                        </div>
                        <p className="text-sm text-zinc-600">{module.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
