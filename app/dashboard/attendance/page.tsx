"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import GlobalHeader from "@/components/global-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function getDefaultAttendancePeriod() {
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return {
        year: previousMonth.getFullYear(),
        month: previousMonth.getMonth() + 1,
    };
}

export default function AttendancePage() {
    const defaultPeriod = getDefaultAttendancePeriod();
    const [year, setYear] = useState(defaultPeriod.year);
    const [month, setMonth] = useState(defaultPeriod.month);
    const [rows, setRows] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const load = async (selectedYear: number, selectedMonth: number) => {
        setLoading(true);
        try {
            const response = await fetch(`/api/attendance?year=${selectedYear}&month=${selectedMonth}`);
            if (!response.ok) {
                throw new Error("Failed to load attendance summary.");
            }
            const data = await response.json();
            setRows(data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load(year, month);
    }, [year, month]);

    const handleDownloadTemplate = async () => {
        const response = await fetch("/api/attendance/template");
        if (!response.ok) {
            throw new Error("Failed to download attendance template.");
        }

        const csv = await response.text();
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "attendance-template.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("year", String(year));
            formData.append("month", String(month));
            const response = await fetch("/api/attendance/import", {
                method: "POST",
                body: formData,
            });

            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload?.error || "Attendance import failed.");
            }

            await load(year, month);
        } catch (error) {
            console.error(error);
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    };

    return (
        <div className="space-y-6">
            <GlobalHeader
                title="Employee Attendance"
                description={`Attendance summary for ${new Date(Date.UTC(year, month - 1, 1)).toLocaleString("id-ID", { month: "long", year: "numeric" })}`}
            />

            <div className="flex flex-col gap-3 rounded-lg border border-input bg-card p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-zinc-700">Period</label>
                    <Input type="number" value={year} onChange={(event) => setYear(Number(event.target.value || defaultPeriod.year))} className="w-28" />
                    <select value={month} onChange={(event) => setMonth(Number(event.target.value))} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                        {Array.from({ length: 12 }, (_, index) => index + 1).map((option) => (
                            <option key={option} value={option}> {new Date(Date.UTC(year, option - 1, 1)).toLocaleString("id-ID", { month: "long" })} </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant="outline" onClick={handleDownloadTemplate}>Download Excel Template</Button>
                    <label className="inline-flex cursor-pointer items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                        {uploading ? "Importing..." : "Import Excel"}
                        <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>

            {loading ? (
                <div className="rounded-lg border border-input bg-card p-6 text-sm text-zinc-600">Loading attendance summary...</div>
            ) : (
                <Table className="border">
                    <TableHeader className="bg-zinc-100">
                        <TableRow>
                            <TableHead>No</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Position</TableHead>
                            <TableHead>Present</TableHead>
                            <TableHead>Leave</TableHead>
                            <TableHead>Leave Quota</TableHead>
                            <TableHead>Permission</TableHead>
                            <TableHead>Permission Quota</TableHead>
                            <TableHead>Unpaid Leave</TableHead>
                            <TableHead>Unpaid Leave Quota</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">View</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row.employeeId}>
                                <TableCell>{row.no}</TableCell>
                                <TableCell className="font-medium">{row.name}</TableCell>
                                <TableCell>{row.position}</TableCell>
                                <TableCell>{row.present.toFixed(1)}</TableCell>
                                <TableCell>{row.leave.toFixed(1)}</TableCell>
                                <TableCell>{row.leaveQuota.toFixed(1)}</TableCell>
                                <TableCell>{row.permission.toFixed(1)}</TableCell>
                                <TableCell>{row.permissionQuota.toFixed(1)}</TableCell>
                                <TableCell>{row.unpaidLeave.toFixed(1)}</TableCell>
                                <TableCell>{row.unpaidLeaveQuota.toFixed(1)}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${row.status === "Fulfilled" ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}`}>
                                        {row.status}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/dashboard/attendance/${row.employeeId}`}>
                                        <Button size="sm" variant="outline">View</Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
