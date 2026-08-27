import { sql } from "drizzle-orm";
import {
    boolean,
    index,
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
        role: varchar("role", { length: 255 }).default("user").notNull(),
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
    (table) => [uniqueIndex("user_phoneNumber_uidx").on(table.phoneNumber)],
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

export const authSchema = {
    user,
    session,
    account,
    verification,
    role,
    rolePermission,
    userRole,
} as const;