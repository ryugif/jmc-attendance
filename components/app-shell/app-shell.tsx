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
import {
    IconLogout
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";
import AppShellNav from "./app-shell-nav";
import Image from "next/image";


export default function AppShell({
    userName,
    children,
}: {
    userName: string;
    children?: ReactNode;
}) {
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    async function handleLogout() {
        setIsLoggingOut(true);

        try {
            await fetch("/api/auth/logout", {
                method: "POST",
            });
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
                        <div className="flex h-9 items-center justify-center rounded-2xl bg-black px-2 text-lg font-bold text-white shadow-sm">
                            <Image
                                src="/favicon.png"
                                alt="JMC Logo"
                                width={36}
                                height={36}
                            />
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

            <div className="mx-auto flex w-full flex-1 flex-col overflow-auto">
                <AppShellNav />

                <section className="flex-1 overflow-auto">
                    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
                        <div className="px-6 py-8 text-base text-zinc-700">{children}</div>
                    </div>
                </section>

                <footer className="py-4 text-center text-sm text-zinc-500 border-t border-zinc-200">
                    © 2026 JMC Attendance
                </footer>
            </div>
        </main>
    );
}
