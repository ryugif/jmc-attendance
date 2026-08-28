"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GlobalHeader from "@/components/global-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { getMonthlyTransportAllowanceList } from "./actions";

type MonthlyAllowanceRow = {
    month: number;
    totalRecipients: number;
    totalAllowance: number;
};

export default function TransportAllowanceMonthlyPage() {
    const [year, setYear] = useState(new Date().getFullYear());
    const [rows, setRows] = useState<MonthlyAllowanceRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await getMonthlyTransportAllowanceList(year);
                setRows(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, [year]);

    return (
        <div className="space-y-6">
            <GlobalHeader title="Transport Allowance" description="Monthly summary of transport allowance calculations." />

            <div className="flex items-center gap-3 rounded-lg border border-input bg-card p-4">
                <label className="text-sm font-medium text-zinc-700">Year</label>
                <Input type="number" min="2024" max="2100" value={year} onChange={(event) => setYear(Number(event.target.value || new Date().getFullYear()))} className="max-w-32" />
            </div>

            {loading ? (
                <div className="rounded-lg border border-input bg-card p-6 text-sm text-zinc-600">Loading monthly summary...</div>
            ) : (
                <Table className="border">
                    <TableHeader className="bg-zinc-100">
                        <TableRow>
                            <TableHead>No.</TableHead>
                            <TableHead>Month</TableHead>
                            <TableHead>Total Recipients</TableHead>
                            <TableHead>Total Transport Allowance</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, index) => (
                            <TableRow key={row.month}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{new Date(Date.UTC(year, row.month - 1, 1)).toLocaleString("id-ID", { month: "long" })}</TableCell>
                                <TableCell>{row.totalRecipients}</TableCell>
                                <TableCell>{formatCurrency(row.totalAllowance)}</TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/dashboard/transport-allowance/${year}/${row.month}`}>
                                        <Button size="sm" variant="outline">Open</Button>
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
