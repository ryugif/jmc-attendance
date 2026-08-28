export const AUDIT_ACTIONS = ["CREATE", "READ", "UPDATE", "DELETE", "LOGIN", "LOGOUT"] as const;

export const AUDIT_MODULES = {
    DASHBOARD: "Dashboard",
    USERS: "Users",
    EMPLOYEES: "Employee",
    ATTENDANCE: "Attendance",
    TRANSPORT_ALLOWANCE: "Transport Allowance",
    TRANSPORT_ALLOWANCE_SETTINGS: "Transport Allowance Settings",
    SETTINGS: "Settings",
    PROVINCE: "Province",
    REGENCY: "Regency",
    DISTRICT: "District",
    DEPARTMENT: "Department",
    JOB_POSITION: "Job Position",
    LOG: "Audit Log",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditModule = (typeof AUDIT_MODULES)[keyof typeof AUDIT_MODULES];

export function formatAuditAction(action: string) {
    switch (action) {
        case "CREATE":
            return "Create";
        case "READ":
            return "Read";
        case "UPDATE":
            return "Update";
        case "DELETE":
            return "Delete";
        case "LOGIN":
            return "Login";
        case "LOGOUT":
            return "Logout";
        default:
            return action;
    }
}

export function getAuditActionBadgeClass(action: string) {
    switch (action) {
        case "CREATE":
            return "bg-emerald-500/10 text-emerald-700";
        case "READ":
            return "bg-sky-500/10 text-sky-700";
        case "UPDATE":
            return "bg-amber-500/10 text-amber-700";
        case "DELETE":
            return "bg-red-500/10 text-red-700";
        case "LOGIN":
            return "bg-blue-500/10 text-blue-700";
        case "LOGOUT":
            return "bg-zinc-500/10 text-zinc-700";
        default:
            return "bg-zinc-500/10 text-zinc-700";
    }
}
