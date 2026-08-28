import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getUserModulePermission } from "@/lib/rbac";
import { getAuditLogList } from "@/lib/audit";

function parseDate(value: string | null) {
    if (!value) {
        return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(request: Request) {
    const headerStore = await headers();
    const session = await auth.api.getSession({
        headers: headerStore,
    });

    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permission = await getUserModulePermission(session.user.id, "log");
    if (!permission?.access || permission.read === "no") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? 1);
    const pageSize = Number(searchParams.get("pageSize") ?? 10);
    const sortField = (searchParams.get("sortField") ?? "createdAt") as "createdAt" | "userName" | "module" | "action";
    const sortDirection = (searchParams.get("sortDirection") ?? "desc") as "asc" | "desc";
    const search = searchParams.get("search") || undefined;

    const result = await getAuditLogList({
        page: Number.isFinite(page) && page > 0 ? page : 1,
        pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10,
        sortField,
        sortDirection,
        filters: {
            userId: searchParams.get("userId") || undefined,
            module: searchParams.get("module") || undefined,
            action: searchParams.get("action") || undefined,
            search,
            from: parseDate(searchParams.get("from")),
            to: parseDate(searchParams.get("to")),
        },
    });

    return NextResponse.json(result);
}
