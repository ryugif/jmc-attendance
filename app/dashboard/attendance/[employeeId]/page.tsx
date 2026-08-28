"use client";

import { useEffect, useState } from "react";

import GlobalHeader from "@/components/global-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AttendanceDetailPage({ params }: { params: { employeeId: string } }) {
    const [records, setRecords] = useState<any[]>([]);
    const [employeeName, setEmployeeName] = useState("Employee");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/attendance/${params.employeeId}`);
                const payload = await response.json();
                if (!response.ok) {
                    throw new Error(payload?.error || "Unable to fetch attendance details.");
                }

                setEmployeeName(payload.employee?.name || "Employee");
                setRecords(payload.records || []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [params.employeeId]);

    return (
        <div className="space-y-6">
            <GlobalHeader title="Attendance Detail" description={`Attendance records for ${employeeName}`} />

            {loading ? (
                <div className="rounded-lg border border-input bg-card p-6 text-sm text-zinc-600">Loading attendance detail...</div>
            ) : (
                <Table className="border">
                    <TableHeader className="bg-zinc-100">
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Check-in Location</TableHead>
                            <TableHead>Attendance</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Verification</TableHead>
                            <TableHead>Verifier</TableHead>
                            <TableHead>Notes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records.map((record) => (
                            <TableRow key={record.id}>
                                <TableCell>{record.date}</TableCell>
                                <TableCell>{record.checkInLocation || "-"}</TableCell>
                                <TableCell>{record.attendanceType || "Present"}</TableCell>
                                <TableCell>{Number(record.duration ?? 0).toFixed(1)}</TableCell>
                                <TableCell>
                                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${record.status === "Fulfilled" ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}`}>
                                        {record.status}
                                    </span>
                                </TableCell>
                                <TableCell>{record.verification || "Approved"}</TableCell>
                                <TableCell>{record.verifier || "Lead"}</TableCell>
                                <TableCell>{record.notes || "-"}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
