"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
    IconHome,
    IconLogout,
    IconSettings,
    IconUserCog,
    IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

const navItems = [
    { label: "Dashboard", icon: IconHome, href: "/dashboard" },
    { label: "Users", icon: IconUsers, href: "/dashboard/users" },
    { label: "Employees", icon: IconUserCog, href: "/dashboard/employees" },
    { label: "Settings", icon: IconSettings, href: "/dashboard/settings" },
];

export default function DashboardShell({
    userName,
    children,
}: {
    userName: string;
    children?: ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const currentItem = navItems.find(
        (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );
    const CurrentIcon = currentItem?.icon ?? IconHome;
    const currentTitle = currentItem?.label ?? "Dashboard";

    async function handleLogout() {
        setIsLoggingOut(true);

        try {
            await authClient.signOut();
            router.replace("/sign-in");
            router.refresh();
        } catch (error) {
            console.error("Failed to log out:", error);
            setIsLoggingOut(false);
        }
    }

    return (
        <main className="flex h-screen flex-col overflow-hidden bg-zinc-100 text-zinc-900">
            <header className="border-b border-zinc-200 bg-white/90">
                <div className="mx-auto flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 items-center justify-center rounded-2xl bg-violet-600 px-2 text-lg font-bold text-white shadow-sm">
                            JMC
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex items-end text-right">
                            <span className="text-sm font-medium text-zinc-700">
                                {userName || "Unknown Name"}
                            </span>
                        </div>

                        <AlertDialog>
                            <AlertDialogTrigger
                                render={
                                    <Button type="button" variant="outline" size="sm" className="gap-2">
                                        <IconLogout size={16} />
                                        Logout
                                    </Button>
                                }
                            />
                            <AlertDialogContent size="sm">
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm logout</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to sign out of the admin dashboard?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleLogout} disabled={isLoggingOut}>
                                        {isLoggingOut ? "Logging out..." : "Logout"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </header>

            <div className="mx-auto flex w-full flex-1 flex-col">
                <nav className="flex flex-wrap bg-zinc-800" aria-label="navigation">
                    <div className="flex items-start overflow-auto text-white">
                        {navItems.map(({ label, icon: Icon, href }) => (
                            <Link
                                key={label}
                                href={href}
                                className={cn(
                                    "flex flex-col items-center gap-1 border-r border-zinc-600 px-6 py-3 text-sm hover:bg-zinc-700",
                                    pathname === href || pathname.startsWith(`${href}/`)
                                        ? "bg-zinc-700"
                                        : "",
                                )}
                            >
                                <Icon stroke={1.8} />
                                <span>{label}</span>
                            </Link>
                        ))}
                    </div>
                </nav>

                <section className="flex-1 overflow-auto">
                    <div className="h-full rounded-2xl border border-zinc-200 bg-white shadow-sm">
                        <div className="border-b border-zinc-200 px-6 py-5">
                            <div className="flex items-center gap-3 text-2xl font-semibold text-zinc-800">
                                <CurrentIcon size={24} className="text-violet-600" />
                                {currentTitle}
                            </div>
                        </div>

                        <div className="px-6 py-8 text-base text-zinc-700">{children}</div>
                    </div>
                </section>

                <footer className="py-4 text-center text-sm text-zinc-500">
                    © 2026 JMC Attendance
                </footer>
            </div>
        </main>
    );
}
