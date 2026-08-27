
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { getUserRoleNameByUserId } from "@/lib/rbac";

export default async function DashboardPage() {
    const headerStore = await headers();
    const session = await auth.api.getSession({
        headers: headerStore,
    });

    if (!session) {
        redirect("/sign-in");
    }

    const userRole = await getUserRoleNameByUserId(session.user.id);
    const userName = session.user.name || "User Name";
    const user = session.user;

    return (
        <div className="space-y-4">
            <p>
                Selamat Datang <span className="font-semibold text-zinc-900">{userName}</span> - {userRole}.
            </p>

            <pre>{JSON.stringify(user, null, 2)}</pre>
        </div>
    );
}
