export type ReadAccess = "all" | "own" | "no";
export type UpdateAccess = "all" | "own" | "no";
export type DeleteAccess = "all" | "own" | "no";

export type RolePermission = {
    module: string;
    access: boolean;
    create: boolean;
    read: ReadAccess;
    update: UpdateAccess;
    delete: DeleteAccess;
};

export type RoleDefinition = {
    name: string;
    description: string;
    permissions: RolePermission[];
};

export const ROLE_DEFINITIONS: RoleDefinition[] = [
    {
        name: "Super Admin",
        description: "Full access to all modules and administrative controls.",
        permissions: [
            { module: "login", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "manage_roles", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "manage_users", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "my_profile", access: true, create: false, read: "all", update: "own", delete: "no" },
            { module: "dashboard", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "employee_data", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "attendance", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "transportation_allowance", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "transportation_allowance_settings", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "log", access: true, create: false, read: "all", update: "no", delete: "no" },
        ],
    },
    {
        name: "HRD Manager",
        description: "Can view role-based reporting but cannot manage user roles or core admin privileges.",
        permissions: [
            { module: "login", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "manage_roles", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "manage_users", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "my_profile", access: true, create: false, read: "all", update: "own", delete: "no" },
            { module: "dashboard", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "employee_data", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "attendance", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "transportation_allowance", access: true, create: false, read: "own", update: "no", delete: "no" },
            { module: "transportation_allowance_settings", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "log", access: false, create: false, read: "no", update: "no", delete: "no" },
        ],
    },
    {
        name: "HRD Admin",
        description: "Can manage employee and attendance data while keeping super-admin employee data restricted.",
        permissions: [
            { module: "login", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "manage_roles", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "manage_users", access: false, create: false, read: "no", update: "no", delete: "no" },
            { module: "my_profile", access: true, create: false, read: "all", update: "own", delete: "no" },
            { module: "dashboard", access: true, create: false, read: "all", update: "no", delete: "no" },
            { module: "employee_data", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "attendance", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "transportation_allowance", access: true, create: false, read: "own", update: "no", delete: "no" },
            { module: "transportation_allowance_settings", access: true, create: true, read: "all", update: "all", delete: "all" },
            { module: "log", access: false, create: false, read: "no", update: "no", delete: "no" },
        ],
    },
];

export function getRoleByName(name: string): RoleDefinition | undefined {
    return ROLE_DEFINITIONS.find((role) => role.name === name);
}
