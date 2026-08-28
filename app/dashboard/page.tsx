
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "@/lib/audit";
import { logAuditEvent } from "@/lib/audit-context";
import { getDashboardDataForUser, type DashboardEmployeeSummary } from "@/lib/dashboard";
import { getUserPermissionMap } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatRoleName(role: string) {
    const normalizedRole = role.trim();

    if (normalizedRole === "Super Admin") {
        return "Superadmin";
    }

    if (normalizedRole === "HRD Manager") {
        return "HR Manager";
    }

    if (normalizedRole === "HRD Admin") {
        return "HR Admin";
    }

    return normalizedRole || "User";
}

function EmployeeStatCard({ label, value }: { label: string; value: number }) {
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-semibold tracking-tight">{value}</div>
            </CardContent>
        </Card>
    );
}

function DoughnutChart({
    title,
    items,
    total,
}: {
    title: string;
    items: Array<{ label: string; value: number; color: string }>;
    total: number;
}) {
    const safeTotal = total || 1;
    const segments = items.reduce<string[]>((accumulator, item) => {
        const previous = accumulator.length === 0 ? 0 : Number.parseFloat(accumulator[accumulator.length - 1].split(" ")[2].replace("%", ""));
        const percent = (item.value / safeTotal) * 100;
        const start = previous;
        const end = start + percent;
        accumulator.push(`${item.color} ${start}% ${end}%`);
        return accumulator;
    }, []).join(", ");

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                    <div
                        className="relative h-28 w-28 shrink-0 rounded-full border border-border/60"
                        style={{
                            background: `conic-gradient(${segments})`,
                        }}
                    >
                        <div className="absolute inset-[22%] rounded-full bg-background" />
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
                            {safeTotal}
                        </div>
                    </div>
                    <div className="space-y-2">
                        {items.map((item) => (
                            <div key={item.label} className="flex items-center gap-2 text-sm">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-muted-foreground">{item.label}</span>
                                <span className="ml-auto font-medium">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function WelcomeCard({ userName, role }: { userName: string; role: string }) {
    return (
        <div className="rounded-xl border bg-card p-6 shadow-sm">
            <p className="text-xl font-medium tracking-tight">
                Welcome <span className="font-semibold text-foreground">{userName}</span> - {role}
            </p>
        </div>
    );
}

export default async function DashboardPage() {
    const headerStore = await headers();
    const session = await auth.api.getSession({
        headers: headerStore,
    });

    if (!session) {
        redirect("/sign-in");
    }

    const userName = session.user.name || "User";
    const dashboardData = await getDashboardDataForUser(session.user.id);
    const roleName = formatRoleName(dashboardData.role ?? "User");

    await logAuditEvent({
        module: AUDIT_MODULES.DASHBOARD,
        action: AUDIT_ACTIONS[1],
        description: "Dashboard page accessed.",
    });

    const permissionMap = await getUserPermissionMap(session.user.id);
    const canViewDashboard = permissionMap["Dashboard"] ?? false;

    if (!canViewDashboard) {
        redirect("/sign-in");
    }

    if (roleName === "Superadmin" || roleName === "HR Admin") {
        return <WelcomeCard userName={userName} role={roleName} />;
    }

    const stats = dashboardData.stats ?? {
        totalEmployees: 0,
        contractEmployees: 0,
        permanentEmployees: 0,
        interns: 0,
    };

    const employmentTypeData = [
        { label: "Contract Employees", value: stats.contractEmployees, color: "#7c3aed" },
        { label: "Permanent Employees", value: stats.permanentEmployees, color: "#3b82f6" },
        { label: "Interns", value: stats.interns, color: "#ec4899" },
    ];

    const genderData = [
        { label: "Male", value: dashboardData.gender.male, color: "#6366f1" },
        { label: "Female", value: dashboardData.gender.female, color: "#f472b6" },
    ];

    return (
        <div className="space-y-6">
            <WelcomeCard userName={userName} role={roleName} />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <EmployeeStatCard label="Total Employees" value={stats.totalEmployees} />
                <EmployeeStatCard label="Contract Employees" value={stats.contractEmployees} />
                <EmployeeStatCard label="Permanent Employees" value={stats.permanentEmployees} />
                <EmployeeStatCard label="Interns" value={stats.interns} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <DoughnutChart title="Employment Type" items={employmentTypeData} total={stats.totalEmployees} />
                <DoughnutChart title="Gender" items={genderData} total={dashboardData.gender.male + dashboardData.gender.female} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recently Joined Employees</CardTitle>
                </CardHeader>
                <CardContent>
                    {dashboardData.recentEmployees.length === 0 ? (
                        <Empty>
                            <EmptyHeader>
                                <EmptyTitle>No recent employees</EmptyTitle>
                            </EmptyHeader>
                            <EmptyContent>
                                <EmptyDescription>No employee join records are available yet.</EmptyDescription>
                            </EmptyContent>
                        </Empty>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">No</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Join Date</TableHead>
                                    <TableHead>Contract Type</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dashboardData.recentEmployees.map((employee: DashboardEmployeeSummary, index: number) => (
                                    <TableRow key={employee.id}>
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell>{employee.name}</TableCell>
                                        <TableCell>{new Date(employee.joinDate).toLocaleDateString()}</TableCell>
                                        <TableCell>{employee.contractType}</TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={`/dashboard/employees/${employee.id}`}
                                                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-2.5 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                            >
                                                Detail
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
