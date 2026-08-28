"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import GlobalHeader from "@/components/global-header";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { deleteTransportAllowanceSetting, listTransportAllowanceSettings } from "@/lib/transport-allowance";

type TransportAllowanceSettingListRow = {
    id: string;
    baseFare: number;
    minDistance: number | string;
    maxDistance: number | string;
    effectiveFrom: string | Date;
};

export default function TransportAllowanceSettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState<TransportAllowanceSettingListRow[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await listTransportAllowanceSettings();
                setSettings(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        void load();
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await deleteTransportAllowanceSetting(id);
            setSettings((current) => current.filter((item) => item.id !== id));
            router.refresh();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="space-y-6">
            <GlobalHeader title="Transport Allowance Settings" description="Configure the transport allowance rate and distance ranges." />

            <div className="flex justify-end">
                <Link href="/dashboard/settings/transport-allowance/create">
                    <Button>Add Setting</Button>
                </Link>
            </div>

            {loading ? (
                <div className="rounded-lg border border-input bg-card p-6 text-sm text-zinc-600">Loading settings...</div>
            ) : settings.length === 0 ? (
                <div className="rounded-lg border border-dashed border-input bg-card p-8 text-center text-zinc-600">
                    No transport allowance settings available yet.
                </div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Effective From</TableHead>
                            <TableHead>Base Fare</TableHead>
                            <TableHead>Min KM</TableHead>
                            <TableHead>Max KM</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {settings.map((setting) => (
                            <TableRow key={setting.id}>
                                <TableCell>{new Date(setting.effectiveFrom).toLocaleDateString("id-ID")}</TableCell>
                                <TableCell>{formatCurrency(Number(setting.baseFare))} / km</TableCell>
                                <TableCell>{Number(setting.minDistance)} km</TableCell>
                                <TableCell>{Number(setting.maxDistance)} km</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={`/dashboard/settings/transport-allowance/${setting.id}/edit`}>
                                            <Button variant="outline" size="sm">Edit</Button>
                                        </Link>
                                        <AlertDialog>
                                            <AlertDialogTrigger render={<Button variant="destructive" size="sm">Delete</Button>} />
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete setting?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will permanently remove the selected transport allowance setting.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => void handleDelete(setting.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
