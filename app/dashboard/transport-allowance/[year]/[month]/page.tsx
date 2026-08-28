"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import GlobalHeader from "@/components/global-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { calculateMonthlyAllowance, getMonthlyTransportAllowanceDetail } from "@/lib/transport-allowance";

type TransportAllowanceDetailRow = {
    id: string;
    name: string;
    eligibleDistance: number | string;
    workingDays: number;
    amount: number | string;
};

export default function TransportAllowanceDetailPage() {
    const params = useParams();
    const year = Number(params.year ?? new Date().getFullYear());
    const month = Number(params.month ?? new Date().getMonth() + 1);
    const [rows, setRows] = useState<TransportAllowanceDetailRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [calculating, setCalculating] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getMonthlyTransportAllowanceDetail(year, month);
            setRows(data as TransportAllowanceDetailRow[]);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [month, year]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void load();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [load]);

    const handleCalculate = async () => {
        setCalculating(true);
        setMessage(null);
        try {
            const result = await calculateMonthlyAllowance(year, month);
            setMessage(result.message);
            await load();
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Calculation failed.");
        } finally {
            setCalculating(false);
        }
    };

    return (
        <div className="space-y-6">
            <GlobalHeader title={`Transport Allowance - ${new Date(Date.UTC(year, month - 1, 1)).toLocaleString("id-ID", { month: "long", year: "numeric" })}`} description="Eligible employees and monthly allowance calculations." />

            <div className="flex items-center justify-between gap-3">
                <Link href="/dashboard/transport-allowance">
                    <Button variant="outline">Back to list</Button>
                </Link>
                <Button onClick={() => void handleCalculate()} disabled={calculating}>
                    {calculating ? "Calculating..." : "Calculate Allowance"}
                </Button>
            </div>

            {message && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{message}</div>}

            {loading ? (
                <div className="rounded-lg border border-input bg-card p-6 text-sm text-zinc-600">Loading allowance detail...</div>
            ) : rows.length === 0 ? (
                <div className="rounded-lg border border-dashed border-input bg-card p-8 text-center text-zinc-600">
                    No allowance results found for this month yet.
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>No.</TableHead>
                            <TableHead>Recipient Name</TableHead>
                            <TableHead>Km</TableHead>
                            <TableHead>Days</TableHead>
                            <TableHead>Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {rows.map((row, index) => (
                            <TableRow key={row.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{row.name}</TableCell>
                                <TableCell>{Number(row.eligibleDistance)}</TableCell>
                                <TableCell>{row.workingDays}</TableCell>
                                <TableCell>{formatCurrency(Number(row.amount))}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
