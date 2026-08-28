# JMC Attendance

A Next.js-based attendance and HR management application for managing employee data, attendance validation, transport allowance, master data, and role-based access.

## Overview

This project is designed to support internal operational workflows for an organization, including:

- employee and user management
- authentication and session management
- RBAC-based module access control
- attendance monitoring and validation
- master data administration for provinces, regencies, districts, departments, and job positions
- transport allowance configuration and calculation
- admin dashboard and settings screens

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- Drizzle ORM
- MySQL
- Better Auth
- shadcn/ui components

## Prerequisites

- Node.js 20+
- pnpm
- MySQL instance (or use the provided Docker Compose setup)

## Local Development

1. Install dependencies:

```bash
pnpm install
```

2. Start MySQL using Docker Compose:

```bash
docker compose up -d
```

3. Create a local environment file if needed and configure the required variables. At minimum:

```bash
DATABASE_URL="mysql://better_auth:better_auth@127.0.0.1:3306/better_auth"
BETTER_AUTH_SECRET="change-this-secret"
BETTER_AUTH_URL="http://localhost:3000"
```

4. Generate Drizzle schema artifacts:

```bash
pnpm db:generate
```

5. Push the schema to MySQL:

```bash
pnpm db:push
```

After the schema is pushed, run the remaining setup steps in order: seed RBAC definitions, seed master data, and finally create a default super admin account.

6. Seed RBAC definitions:

```bash
pnpm db:seed:roles
```

7. Seed master data:

```bash
pnpm db:seed:master-data
```

8. Create a default super admin account:

```bash
pnpm create:super-admin
```

You can customize the default super admin values with environment variables such as:

```bash
SUPER_ADMIN_EMAIL=superadmin@example.com
SUPER_ADMIN_NAME="Super Admin"
SUPER_ADMIN_USERNAME=superadmin
SUPER_ADMIN_PASSWORD="SuperAdmin123!"
```

9. Start the app:

```bash
pnpm dev
```

Then open http://localhost:3000.

## Available Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm db:generate
pnpm db:push
pnpm db:seed:roles
pnpm db:seed:master-data
pnpm create:super-admin
```

## Database and Auth Notes

- The app uses MySQL with Drizzle as the schema layer.
- Better Auth is configured with email/password auth and a custom session hook that blocks inactive users.
- The RBAC model is database-driven, with role definitions and permission records seeded through scripts.
- The default database name in the local Docker setup is `better_auth`.

## References

- Next.js: https://nextjs.org
- Drizzle ORM: https://orm.drizzle.team
- Better Auth: https://better-auth.com
- Tailwind CSS: https://tailwindcss.com
