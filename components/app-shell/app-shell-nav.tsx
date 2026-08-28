"use client";

import { cn } from "@/lib/utils";
import {
    IconCalendar,
    IconHome,
    IconSettings,
    IconTicket,
    IconUserCog,
    IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
    { label: "Dashboard", icon: IconHome, href: "/dashboard" },
    { label: "Users", icon: IconUsers, href: "/dashboard/users" },
    { label: "Employees", icon: IconUserCog, href: "/dashboard/employees" },
    { label: "Attendance", icon: IconCalendar, href: "/dashboard/attendance" },
    { label: "Transport Allowance", icon: IconTicket, href: "/dashboard/transport-allowance" },
    { label: "Settings", icon: IconSettings, href: "/dashboard/settings" },
];

function isNavItemActive(currentPath: string, href: string) {
    if (href === "/dashboard") {
        return currentPath === href;
    }

    return currentPath === href || currentPath.startsWith(`${href}/`);
}

export default function AppShellNav() {
    const pathname = usePathname();
    const [activePath, setActivePath] = useState(pathname);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setActivePath(pathname);
    }, [pathname]);

    return (
        <nav className="flex flex-wrap bg-zinc-800" aria-label="navigation">
            <div className="flex items-start overflow-auto text-white">
                {navItems.map(({ label, icon: Icon, href }) => (
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
    )
}