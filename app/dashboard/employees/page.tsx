"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";

import GlobalHeader from "@/components/global-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bulkDeleteEmployees, bulkUpdateEmployeeStatus, getEmployeeList } from "@/app/dashboard/employees/actions";

interface EmployeeRecord {
    id: string;
    nip: string;
    name: string;
    email: string;
    phoneNumber: string;
    placeOfBirth: string;
    districtName: string;
    regencyName: string;
    provinceName: string;
    fullAddress: string;
    homeToOfficeDistance: number;
    dateOfBirth: string | Date;
    age: number;
    maritalStatus: "Married" | "Not Married";
    numberOfChildren: number;
    joinDate: string | Date;
    departmentId: string | null;
    departmentName: string | null;
    position: "Manager" | "Staff" | "Intern";
    contractStatus: "Permanent" | "Contract" | "Internship" | "Probation";
    status: "Active" | "Inactive";
    lengthOfService: number;
}

interface PaginationData {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

type SortField = "nip" | "name" | "position" | "joinDate" | "lengthOfService";
type SortDirection = "asc" | "desc";

const pageSize = 10;

export default function EmployeesPage() {
    const router = useRouter();
    const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [positionFilter, setPositionFilter] = useState("all");
    const [contractFilter, setContractFilter] = useState("all");
    const [minService, setMinService] = useState("");
    const [maxService, setMaxService] = useState("");
    const [bulkStatus, setBulkStatus] = useState("");
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<PaginationData>({
        page: 1,
        pageSize,
        total: 0,
        totalPages: 1,
    });
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

    const fetchEmployees = useCallback(
        async (page: number, nextSearch = search) => {
            setLoading(true);
            try {
                const result = await getEmployeeList(page, pageSize, {
                    search: nextSearch,
                    position: positionFilter !== "all" ? [positionFilter] : [],
                    contractStatus: contractFilter !== "all" ? contractFilter : undefined,
                    minLengthOfService: minService ? Number(minService) : undefined,
                    maxLengthOfService: maxService ? Number(maxService) : undefined,
                });

                if (result.success) {
                    setEmployees(result.data as unknown as EmployeeRecord[]);
                    setPagination(result.pagination);
                    setSelectedIds([]);
                }
            } catch (error) {
                console.error("Error fetching employees:", error);
            } finally {
                setLoading(false);
            }
        },
        [contractFilter, maxService, minService, positionFilter, search],
    );

    const initialLoadRef = useRef(false);

    useEffect(() => {
        if (initialLoadRef.current) {
            return;
        }

        initialLoadRef.current = true;
        const timeoutId = window.setTimeout(() => {
            void fetchEmployees(1);
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [fetchEmployees]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void fetchEmployees(1, search);
        }, 250);

        return () => window.clearTimeout(timeoutId);
    }, [fetchEmployees, search, positionFilter, contractFilter, minService, maxService]);

    const sortedEmployees = useMemo(() => {
        const clone = [...employees];
        clone.sort((left, right) => {
            const direction = sortDirection === "asc" ? 1 : -1;

            const leftValue = left[sortField];
            const rightValue = right[sortField];

            if (typeof leftValue === "number" && typeof rightValue === "number") {
                return (leftValue - rightValue) * direction;
            }

            return String(leftValue).localeCompare(String(rightValue)) * direction;
        });

        return clone;
    }, [employees, sortDirection, sortField]);

    const toggleSelection = (id: string) => {
        setSelectedIds((previous) =>
            previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
        );
    };

    const toggleAll = () => {
        if (selectedIds.length === employees.length) {
            setSelectedIds([]);
            return;
        }

        setSelectedIds(employees.map((employee) => employee.id));
    };

    const handleDeleteSelected = async () => {
        if (!selectedIds.length) {
            return;
        }

        try {
            await bulkDeleteEmployees(selectedIds);
            void fetchEmployees(pagination.page);
        } catch (error) {
            console.error("Error deleting employees:", error);
        }
    };

    const handleBulkStatus = async () => {
        if (!selectedIds.length || !bulkStatus) {
            return;
        }

        try {
            await bulkUpdateEmployeeStatus(selectedIds, bulkStatus as "Active" | "Inactive");
            setBulkStatus("");
            void fetchEmployees(pagination.page);
        } catch (error) {
            console.error("Error updating employee status:", error);
        }
    };

    const handleDownloadCsv = () => {
        if (!employees.length) {
            return;
        }

        const header = ["NIP", "Name", "Position", "Department", "Join Date", "Length of Service", "Status"];
        const rows = employees.map((employee) => [
            employee.nip,
            employee.name,
            employee.position,
            employee.departmentName ?? "",
            employee.joinDate,
            String(employee.lengthOfService),
            employee.status,
        ]);

        const csv = [header, ...rows].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "employees.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadPdf = () => {
        if (!employees.length) {
            return;
        }

        const doc = new jsPDF({ unit: "pt", format: "a4" });
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const marginX = 40;
        const startY = 60;
        const lineHeight = 16;
        const maxTextWidth = pageWidth - marginX * 2;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Employee List", marginX, 36);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        let currentY = startY;

        for (const [index, employee] of employees.entries()) {
            const line = `${index + 1}. ${employee.nip} | ${employee.name} | ${employee.position} | ${employee.status}`;
            const wrapped = doc.splitTextToSize(line, maxTextWidth) as string[];

            for (const wrappedLine of wrapped) {
                if (currentY > pageHeight - 40) {
                    doc.addPage();
                    currentY = 40;
                }

                doc.text(wrappedLine, marginX, currentY);
                currentY += lineHeight;
            }
        }

        doc.save("employees.pdf");
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
            return;
        }

        setSortField(field);
        setSortDirection("asc");
    };

    return (
        <div className="space-y-6">
            <GlobalHeader
                title="Employees"
                description="Manage employee profiles, attendance-related metadata, and status updates."
            />

            <div className="flex flex-col gap-4 rounded-lg border border-input bg-card p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="w-full max-w-xl">
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by name, NIP, or position..."
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Button type="button" variant="outline" onClick={handleDownloadCsv}>Download Excel</Button>
                        <Button type="button" variant="outline" onClick={handleDownloadPdf}>Download PDF</Button>
                        <Link href="/dashboard/employees/create">
                            <Button type="button">New Employee</Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-3 md:grid-cols-4">
                    <select
                        value={positionFilter}
                        onChange={(event) => setPositionFilter(event.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="all">All positions</option>
                        <option value="Manager">Manager</option>
                        <option value="Staff">Staff</option>
                        <option value="Intern">Intern</option>
                    </select>

                    <select
                        value={contractFilter}
                        onChange={(event) => setContractFilter(event.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="all">All contract statuses</option>
                        <option value="Permanent">Permanent</option>
                        <option value="Contract">Contract</option>
                        <option value="Internship">Internship</option>
                        <option value="Probation">Probation</option>
                    </select>

                    <Input
                        type="number"
                        inputMode="numeric"
                        value={minService}
                        onChange={(event) => setMinService(event.target.value)}
                        placeholder="Min years"
                    />

                    <Input
                        type="number"
                        inputMode="numeric"
                        value={maxService}
                        onChange={(event) => setMaxService(event.target.value)}
                        placeholder="Max years"
                    />
                </div>
            </div>

            {selectedIds.length > 0 && (
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-input bg-card p-3">
                    <span className="text-sm font-medium">{selectedIds.length} selected</span>
                    <select
                        value={bulkStatus}
                        onChange={(event) => setBulkStatus(event.target.value)}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                        <option value="">Status action</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                    <Button type="button" variant="outline" onClick={handleBulkStatus} disabled={!bulkStatus}>Apply status</Button>
                    <Button type="button" variant="destructive" onClick={handleDeleteSelected}>Delete selected</Button>
                </div>
            )}

            {loading ? (
                <div className="rounded-lg border border-input bg-card p-6 text-center text-sm text-muted-foreground">
                    Loading employees...
                </div>
            ) : employees.length === 0 ? (
                <div className="rounded-lg border border-dashed border-input bg-card p-10 text-center">
                    <div className="text-lg font-medium">No employees found</div>
                    <div className="mt-2 text-sm text-muted-foreground">Adjust the filters or create a new employee.</div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-lg border border-input bg-card">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-muted/40">
                                <tr>
                                    <th className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.length === employees.length && employees.length > 0}
                                            onChange={toggleAll}
                                            aria-label="Select all employees"
                                        />
                                    </th>
                                    <th className="px-4 py-3">No</th>
                                    <th className="px-4 py-3">
                                        <button type="button" className="font-medium" onClick={() => handleSort("nip")}>NIP</button>
                                    </th>
                                    <th className="px-4 py-3">
                                        <button type="button" className="font-medium" onClick={() => handleSort("name")}>Name</button>
                                    </th>
                                    <th className="px-4 py-3">
                                        <button type="button" className="font-medium" onClick={() => handleSort("position")}>Position</button>
                                    </th>
                                    <th className="px-4 py-3">
                                        <button type="button" className="font-medium" onClick={() => handleSort("joinDate")}>Join Date</button>
                                    </th>
                                    <th className="px-4 py-3">
                                        <button type="button" className="font-medium" onClick={() => handleSort("lengthOfService")}>Length of Service</button>
                                    </th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedEmployees.map((employee, index) => (
                                    <tr key={employee.id} className="border-t border-input align-top">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(employee.id)}
                                                onChange={() => toggleSelection(employee.id)}
                                                aria-label={`Select ${employee.name}`}
                                            />
                                        </td>
                                        <td className="px-4 py-3">{index + 1}</td>
                                        <td className="px-4 py-3 font-medium">{employee.nip}</td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium">{employee.name}</div>
                                            <div className="text-xs text-muted-foreground">{employee.email}</div>
                                        </td>
                                        <td className="px-4 py-3">{employee.position}</td>
                                        <td className="px-4 py-3">{new Date(employee.joinDate).toLocaleDateString()}</td>
                                        <td className="px-4 py-3">{employee.lengthOfService} yrs</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${employee.status === "Active" ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}`}>
                                                {employee.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button type="button" variant="outline" size="sm" onClick={() => router.push(`/dashboard/employees/${employee.id}`)}>Detail</Button>
                                                <Button type="button" variant="outline" size="sm" onClick={() => router.push(`/dashboard/employees/${employee.id}/edit`)}>Edit</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between border-t border-input px-4 py-3 text-sm text-muted-foreground">
                        <span>
                            Page {pagination.page} of {pagination.totalPages} ({pagination.total} employees)
                        </span>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={pagination.page <= 1}
                                onClick={() => void fetchEmployees(Math.max(1, pagination.page - 1))}
                            >
                                Previous
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={pagination.page >= pagination.totalPages}
                                onClick={() => void fetchEmployees(Math.min(pagination.totalPages, pagination.page + 1))}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
