"use server";

import {
    calculateMonthlyAllowance as calculateAllowance,
    getMonthlyTransportAllowanceDetail as getMonthlyDetail,
    getMonthlyTransportAllowanceList as getMonthlyList,
} from "@/lib/transport-allowance";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/lib/audit";
import { logAuditEvent } from "@/lib/audit-context";

export async function getMonthlyTransportAllowanceList(year: number) {
    const rows = await getMonthlyList(year);

    await logAuditEvent({
        module: AUDIT_MODULES.TRANSPORT_ALLOWANCE,
        action: AUDIT_ACTIONS[1],
        description: "Transport allowance monthly summary accessed.",
        metadata: { year },
    });

    return rows;
}

export async function getMonthlyTransportAllowanceDetail(year: number, month: number) {
    const rows = await getMonthlyDetail(year, month);

    await logAuditEvent({
        module: AUDIT_MODULES.TRANSPORT_ALLOWANCE,
        action: AUDIT_ACTIONS[1],
        description: "Transport allowance detail accessed.",
        metadata: { year, month },
    });

    return rows;
}

export async function calculateMonthlyAllowance(year: number, month: number) {
    const result = await calculateAllowance(year, month);

    await logAuditEvent({
        module: AUDIT_MODULES.TRANSPORT_ALLOWANCE,
        action: AUDIT_ACTIONS[2],
        description: "Transport allowance calculation executed.",
        metadata: { year, month },
    });

    return result;
}
