import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import AppShell from "@/components/app-shell/app-shell";
import { db } from "@/lib/db";
import { getUserPermissionMap } from "@/lib/rbac";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const headerStore = await headers();
    const session = await auth.api.getSession({
        headers: headerStore,
    });

    if (!session) {
        redirect("/sign-in");
    }

    const [currentUser] = await db
        .select({ isActive: user.isActive })
        .from(user)
        .where(eq(user.id, session.user.id))
        .limit(1);

    if (!currentUser || currentUser.isActive === false) {
        redirect("/sign-in");
    }

    const permissions = await getUserPermissionMap(session.user.id);

    return (
        <AppShell
            userName={session.user.name || "User Name"}
            permissions={permissions}
        >
            {children}
        </AppShell>
    );
}
