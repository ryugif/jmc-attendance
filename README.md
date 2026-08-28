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

## Current Feature Areas

### Authentication and authorization

- email/password sign-in flow via Better Auth
- username and phone number support via auth plugins
- inactive-user guard during session creation
- RBAC permission definitions for roles such as Super Admin, HRD Manager, and HRD Admin
- module permissions stored in the database

### Employee and user management

- user profile with role, department, and job position relationships
- admin user screens under the dashboard area
- employee CRUD flows and employee detail pages

### Attendance management

- attendance status calculation logic
- late arrival handling and effective working hours evaluation
- location validation logic for office attendance check-in/check-out
- test coverage for attendance logic

### Master data management

- province, regency, district, department, and job position management
- master data pages and model-driven list/detail patterns
- lookup data used by employee and attendance workflow

### Transport allowance

- allowance settings and calculation logic
- month-based transport allowance processing
- support for distance and fare configuration

## Project Structure

```text
app/
  api/
  dashboard/
  sign-in/
components/
lib/
  attendance-logic.ts
  attendance.ts
  auth.ts
  db.ts
  master-data.ts
  rbac.ts
  schema.ts
  transport-allowance.ts
scripts/
  create-super-admin.ts
  seed-master-data.ts
  seed-rbac.ts
tests/
  attendance-logic.test.ts
docker-compose.yml
drizzle/
```

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

## Status

This repository is in an active development state. Core attendance, authentication, role management, and administrative screens are already present, and the codebase continues to evolve around those business workflows.

## References

- Next.js: https://nextjs.org
- Drizzle ORM: https://orm.drizzle.team
- Better Auth: https://better-auth.com
- Tailwind CSS: https://tailwindcss.com
