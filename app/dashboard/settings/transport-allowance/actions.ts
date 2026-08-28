"use server";

import {
    createTransportAllowanceSetting as createSetting,
    deleteTransportAllowanceSetting as deleteSetting,
    getTransportAllowanceSettingDetail as getSettingDetail,
    listTransportAllowanceSettings as listSettings,
    updateTransportAllowanceSetting as updateSetting,
} from "@/lib/transport-allowance";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/lib/audit";
import { logAuditEvent } from "@/lib/audit-context";

export async function listTransportAllowanceSettings() {
    const rows = await listSettings();

    await logAuditEvent({
        module: AUDIT_MODULES.TRANSPORT_ALLOWANCE_SETTINGS,
        action: AUDIT_ACTIONS[1],
        description: "Transport allowance settings list accessed.",
    });

    return rows;
}

export async function getTransportAllowanceSettingDetail(id: string) {
    const record = await getSettingDetail(id);

    await logAuditEvent({
        module: AUDIT_MODULES.TRANSPORT_ALLOWANCE_SETTINGS,
        action: AUDIT_ACTIONS[1],
        resourceId: id,
        description: "Transport allowance setting detail accessed.",
    });

    return record;
}

export async function createTransportAllowanceSetting(input: {
    baseFare: number;
    minDistance: number;
    maxDistance: number;
    effectiveFrom: string;
}) {
    const result = await createSetting(input);

    await logAuditEvent({
        module: AUDIT_MODULES.TRANSPORT_ALLOWANCE_SETTINGS,
        action: AUDIT_ACTIONS[0],
        resourceId: result.id,
        description: "Transport allowance setting created.",
        metadata: input,
    });

    return result;
}

export async function updateTransportAllowanceSetting(
    id: string,
    input: {
        baseFare?: number;
        minDistance?: number;
        maxDistance?: number;
        effectiveFrom?: string;
    },
) {
    const result = await updateSetting(id, input);

    await logAuditEvent({
        module: AUDIT_MODULES.TRANSPORT_ALLOWANCE_SETTINGS,
        action: AUDIT_ACTIONS[2],
        resourceId: id,
        description: "Transport allowance setting updated.",
        metadata: input,
    });

    return result;
}

export async function deleteTransportAllowanceSetting(id: string) {
    const result = await deleteSetting(id);

    await logAuditEvent({
        module: AUDIT_MODULES.TRANSPORT_ALLOWANCE_SETTINGS,
        action: AUDIT_ACTIONS[3],
        resourceId: id,
        description: "Transport allowance setting deleted.",
    });

    return result;
}
