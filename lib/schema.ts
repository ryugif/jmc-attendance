import { sql } from "drizzle-orm";
import {
    boolean,
    date,
    index,
    decimal,
    int,
    mysqlEnum,
    mysqlTable,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from "drizzle-orm/mysql-core";

export const user = mysqlTable(
    "user",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        name: varchar("name", { length: 255 }).notNull(),
        email: varchar("email", { length: 255 }).notNull().unique(),
        emailVerified: boolean("email_verified").default(false).notNull(),
        username: varchar("username", { length: 255 }).notNull().unique(),
        image: text("image"),
        phoneNumber: varchar("phone_number", { length: 255 }),
        phoneNumberVerified: boolean("phone_number_verified").default(false).notNull(),
        roleId: varchar("role_id", { length: 36 }).references(() => role.id, { onDelete: "set null" }),
        departmentId: varchar("department_id", { length: 36 }).references(() => department.id, {
            onDelete: "set null",
        }),
        jobPositionId: varchar("job_position_id", { length: 36 }).references(() => jobPosition.id, {
            onDelete: "set null",
        }),
        employeeCode: varchar("employee_code", { length: 50 }),
        isActive: boolean("is_active").default(true).notNull(),
        banned: boolean("banned").default(false).notNull(),
        banReason: text("ban_reason"),
        banExpires: timestamp("ban_expires", { fsp: 3 }),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        updatedAt: timestamp("updated_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        uniqueIndex("user_phoneNumber_uidx").on(table.phoneNumber),
        index("user_department_id_idx").on(table.departmentId),
        index("user_job_position_id_idx").on(table.jobPositionId),
        index("user_role_id_idx").on(table.roleId),
    ],
);

export const session = mysqlTable(
    "session",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        expiresAt: timestamp("expires_at", { fsp: 3 }).notNull(),
        token: varchar("token", { length: 255 }).notNull().unique(),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        updatedAt: timestamp("updated_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .$onUpdate(() => new Date())
            .notNull(),
        ipAddress: text("ip_address"),
        userAgent: text("user_agent"),
        userId: varchar("user_id", { length: 36 })
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        impersonatedBy: varchar("impersonated_by", { length: 255 }),
    },
    (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = mysqlTable(
    "account",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        issuer: varchar("issuer", { length: 191 }).notNull(),
        accountId: varchar("account_id", { length: 191 }).notNull(),
        providerId: varchar("provider_id", { length: 191 }).notNull(),
        userId: varchar("user_id", { length: 36 })
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        accessToken: text("access_token"),
        refreshToken: text("refresh_token"),
        idToken: text("id_token"),
        accessTokenExpiresAt: timestamp("access_token_expires_at", {
            fsp: 3,
        }),
        refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
            fsp: 3,
        }),
        scope: text("scope"),
        password: text("password"),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        updatedAt: timestamp("updated_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        uniqueIndex("account_issuer_accountId_uidx").on(
            table.issuer,
            table.accountId,
        ),
        index("account_userId_idx").on(table.userId),
    ],
);

export const verification = mysqlTable(
    "verification",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        identifier: varchar("identifier", { length: 255 }).notNull(),
        value: text("value").notNull(),
        expiresAt: timestamp("expires_at", { fsp: 3 }).notNull(),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        updatedAt: timestamp("updated_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const role = mysqlTable(
    "role",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        name: varchar("name", { length: 255 }).notNull().unique(),
        description: text("description"),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        updatedAt: timestamp("updated_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("role_name_idx").on(table.name)],
);

export const rolePermission = mysqlTable(
    "role_permission",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        roleId: varchar("role_id", { length: 36 })
            .notNull()
            .references(() => role.id, { onDelete: "cascade" }),
        moduleName: varchar("module_name", { length: 255 }).notNull(),
        access: boolean("access").default(false).notNull(),
        create: boolean("create").default(false).notNull(),
        read: mysqlEnum("read", ["all", "own", "no"]).default("no").notNull(),
        update: mysqlEnum("update", ["all", "own", "no"]).default("no").notNull(),
        delete: mysqlEnum("delete", ["all", "own", "no"]).default("no").notNull(),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        updatedAt: timestamp("updated_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("role_permission_role_id_idx").on(table.roleId),
        uniqueIndex("role_permission_role_module_uidx").on(
            table.roleId,
            table.moduleName,
        ),
    ],
);

export const userRole = mysqlTable(
    "user_role",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        userId: varchar("user_id", { length: 36 })
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        roleId: varchar("role_id", { length: 36 })
            .notNull()
            .references(() => role.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
    },
    (table) => [
        index("user_role_user_id_idx").on(table.userId),
        index("user_role_role_id_idx").on(table.roleId),
        uniqueIndex("user_role_user_role_uidx").on(table.userId, table.roleId),
    ],
);

export const province = mysqlTable(
    "province",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        code: varchar("code", { length: 50 }),
        name: varchar("name", { length: 255 }).notNull(),
        description: text("description"),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        updatedAt: timestamp("updated_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("province_name_idx").on(table.name)],
);

export const regency = mysqlTable(
    "regency",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        code: varchar("code", { length: 50 }),
        name: varchar("name", { length: 255 }).notNull(),
        description: text("description"),
        provinceId: varchar("province_id", { length: 36 })
            .notNull()
            .references(() => province.id, { onDelete: "cascade" }),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        updatedAt: timestamp("updated_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("regency_province_id_idx").on(table.provinceId),
        index("regency_name_idx").on(table.name),
    ],
);

export const district = mysqlTable(
    "district",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        code: varchar("code", { length: 50 }),
        name: varchar("name", { length: 255 }).notNull(),
        description: text("description"),
        regencyId: varchar("regency_id", { length: 36 })
            .notNull()
            .references(() => regency.id, { onDelete: "cascade" }),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        updatedAt: timestamp("updated_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("district_regency_id_idx").on(table.regencyId),
        index("district_name_idx").on(table.name),
    ],
);

export const department = mysqlTable(
    "department",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        code: varchar("code", { length: 50 }),
        name: varchar("name", { length: 255 }).notNull(),
        description: text("description"),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        updatedAt: timestamp("updated_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("department_name_idx").on(table.name)],
);

export const jobPosition = mysqlTable(
    "job_position",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        code: varchar("code", { length: 50 }),
        name: varchar("name", { length: 255 }).notNull(),
        description: text("description"),
        departmentId: varchar("department_id", { length: 36 }).references(() => department.id, {
            onDelete: "set null",
        }),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        updatedAt: timestamp("updated_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("job_position_department_id_idx").on(table.departmentId),
        index("job_position_name_idx").on(table.name),
    ],
);

export const employee = mysqlTable(
    "employee",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        nip: varchar("nip", { length: 50 }).notNull().unique(),
        name: varchar("name", { length: 255 }).notNull(),
        email: varchar("email", { length: 255 }).notNull(),
        phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
        photoUrl: text("photo_url"),
        placeOfBirth: varchar("place_of_birth", { length: 255 }).notNull(),
        districtId: varchar("district_id", { length: 36 }).references(() => district.id, {
            onDelete: "set null",
        }),
        districtName: varchar("district_name", { length: 255 }).notNull(),
        regencyId: varchar("regency_id", { length: 36 }).references(() => regency.id, {
            onDelete: "set null",
        }),
        regencyName: varchar("regency_name", { length: 255 }).notNull(),
        provinceId: varchar("province_id", { length: 36 }).references(() => province.id, {
            onDelete: "set null",
        }),
        provinceName: varchar("province_name", { length: 255 }).notNull(),
        fullAddress: text("full_address").notNull(),
        homeToOfficeDistance: int("home_to_office_distance").notNull(),
        dateOfBirth: date("date_of_birth").notNull(),
        age: int("age").notNull(),
        maritalStatus: mysqlEnum("marital_status", ["Married", "Not Married"]).notNull(),
        numberOfChildren: int("number_of_children").notNull().default(0),
        joinDate: date("join_date").notNull(),
        position: mysqlEnum("position", ["Manager", "Staff", "Intern"]).notNull(),
        departmentId: varchar("department_id", { length: 36 }).references(() => department.id, {
            onDelete: "set null",
        }),
        contractStatus: mysqlEnum("contract_status", [
            "Permanent",
            "Contract",
            "Internship",
            "Probation",
        ]).notNull().default("Permanent"),
        status: mysqlEnum("status", ["Active", "Inactive"]).notNull().default("Active"),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        updatedAt: timestamp("updated_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("employee_name_idx").on(table.name),
        index("employee_nip_idx").on(table.nip),
        index("employee_department_id_idx").on(table.departmentId),
        index("employee_status_idx").on(table.status),
    ],
);

export const employeeEducation = mysqlTable(
    "employee_education",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        employeeId: varchar("employee_id", { length: 36 })
            .notNull()
            .references(() => employee.id, { onDelete: "cascade" }),
        level: varchar("level", { length: 100 }).notNull(),
        schoolName: varchar("school_name", { length: 255 }).notNull(),
        graduationYear: int("graduation_year").notNull(),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
    },
    (table) => [
        index("employee_education_employee_id_idx").on(table.employeeId),
    ],
);

export const attendance = mysqlTable(
    "attendance",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        employeeId: varchar("employee_id", { length: 36 })
            .notNull()
            .references(() => employee.id, { onDelete: "cascade" }),
        attendanceDate: date("attendance_date").notNull(),
        isPresent: boolean("is_present").default(true).notNull(),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
    },
    (table) => [
        index("attendance_employee_id_idx").on(table.employeeId),
        uniqueIndex("attendance_employee_date_uidx").on(table.employeeId, table.attendanceDate),
    ],
);

export const transportAllowanceSetting = mysqlTable(
    "transport_allowance_setting",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        baseFare: int("base_fare").notNull(),
        minDistance: decimal("min_distance", { precision: 10, scale: 2 }).notNull(),
        maxDistance: decimal("max_distance", { precision: 10, scale: 2 }).notNull(),
        effectiveFrom: date("effective_from").notNull(),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        updatedAt: timestamp("updated_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("transport_allowance_setting_effective_from_idx").on(table.effectiveFrom)],
);

export const transportAllowanceResult = mysqlTable(
    "transport_allowance_result",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        employeeId: varchar("employee_id", { length: 36 })
            .notNull()
            .references(() => employee.id, { onDelete: "cascade" }),
        year: int("year").notNull(),
        month: int("month").notNull(),
        baseFare: int("base_fare").notNull(),
        roundedDistance: decimal("rounded_distance", { precision: 10, scale: 2 }).notNull(),
        eligibleDistance: decimal("eligible_distance", { precision: 10, scale: 2 }).notNull(),
        workingDays: int("working_days").notNull(),
        amount: int("amount").notNull(),
        createdAt: timestamp("created_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        updatedAt: timestamp("updated_at", { fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("transport_allowance_result_employee_idx").on(table.employeeId),
        index("transport_allowance_result_year_month_idx").on(table.year, table.month),
        uniqueIndex("transport_allowance_result_employee_year_month_uidx").on(
            table.employeeId,
            table.year,
            table.month,
        ),
    ],
);

export const authSchema = {
    user,
    session,
    account,
    verification,
    role,
    rolePermission,
    userRole,
    province,
    regency,
    district,
    department,
    jobPosition,
    employee,
    employeeEducation,
    attendance,
    transportAllowanceSetting,
    transportAllowanceResult,
} as const;