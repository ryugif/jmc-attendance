import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export default async function DashboardPage() {
    const headerStore = await headers();
    const session = await auth.api.getSession({
        headers: headerStore,
    });

    if (!session) {
        redirect("/sign-in");
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
            <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-lg">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-600">Dashboard</p>
                <h1 className="mt-3 text-3xl font-bold text-slate-900">Welcome back</h1>
                <p className="mt-2 text-slate-600">
                    You are signed in as <span className="font-semibold text-slate-900">{session.user.name}</span>.
                </p>
            </div>
        </main>
    );
}
