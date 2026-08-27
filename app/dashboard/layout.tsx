import { headers } from "next/headers";
import { redirect } from "next/navigation";

import DashboardShell from "./dashboard-shell";
import { auth } from "@/lib/auth";

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

    return (
        <DashboardShell
            userName={session.user.name || "User Name"}
        >
            {children}
        </DashboardShell>
    );
}
