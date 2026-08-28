"use client";

import { cn } from "@/lib/utils";
import {
    IconCalendar,
    IconCar,
    IconHome,
    IconLogs,
    IconSettings,
    IconUserCog,
    IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
    { label: "Dashboard", icon: IconHome, href: "/dashboard", module: "Dashboard" },
    { label: "Users", icon: IconUsers, href: "/dashboard/users", module: "Users" },
    { label: "Employees", icon: IconUserCog, href: "/dashboard/employees", module: "Employee" },
    { label: "Attendance", icon: IconCalendar, href: "/dashboard/attendance", module: "Attendance" },
    { label: "Transport Allowance", icon: IconCar, href: "/dashboard/transport-allowance", module: "Transport Allowance" },
    { label: "Audit Log", icon: IconLogs, href: "/dashboard/log", module: "Audit Log" },
    { label: "Settings", icon: IconSettings, href: "/dashboard/settings", module: "Settings" },
];

function isNavItemActive(currentPath: string, href: string) {
    if (href === "/dashboard") {
        return currentPath === href;
    }

    return currentPath === href || currentPath.startsWith(`${href}/`);
}

export default function AppShellNav({ permissions = {} }: { permissions?: Record<string, boolean> }) {
    const pathname = usePathname();
    const [activePath, setActivePath] = useState(pathname);

    useEffect(() => {
        setActivePath(pathname);
    }, [pathname]);

    const visibleNavItems = navItems.filter(({ module }) => permissions[module] ?? true);

    return (
        <nav className="flex flex-wrap bg-zinc-800" aria-label="navigation">
            <div className="flex items-start overflow-auto text-white">
                {visibleNavItems.map(({ label, icon: Icon, href }) => (
                    <Link
                        key={label}
                        href={href}
                        className={cn(
                            "flex flex-col items-center gap-1 border-r border-zinc-600 px-6 py-3 text-sm hover:bg-zinc-700",
                            isNavItemActive(activePath, href) ? "bg-zinc-700" : "",
                        )}
                    >
                        <Icon stroke={1.8} />
                        <span>{label}</span>
                    </Link>
                ))}
            </div>
        </nav>
    );
}