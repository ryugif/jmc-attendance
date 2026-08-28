"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { IconChevronDown, IconChevronUp, IconSearch, IconZoomExclamation } from "@tabler/icons-react";

import GlobalHeader from "@/components/global-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AUDIT_ACTIONS, AUDIT_MODULES, formatAuditAction, getAuditActionBadgeClass } from "@/lib/audit-helpers";

type SortField = "createdAt" | "userName" | "module" | "action";
type SortDirection = "asc" | "desc";

type AuditLogRecord = {
    id: string;
    userId: string;
    userName: string;
    module: string;
    action: string;
    resourceId: string | null;
    description: string | null;
    createdAt: string;
};

type PaginationData = {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
};

export default function AuditLogClient() {
    const [rows, setRows] = useState<AuditLogRecord[]>([]);
    const [users, setUsers] = useState<Array<{ userId: string; userName: string }>>([]);
    const [pagination, setPagination] = useState<PaginationData>({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState("all");
    const [selectedModule, setSelectedModule] = useState("all");
    const [selectedAction, setSelectedAction] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortField, setSortField] = useState<SortField>("createdAt");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [currentPage, setCurrentPage] = useState(1);

    const pageSize = 10;

    const fetchRows = useCallback(
        async (page: number) => {
            setLoading(true);
            try {
                const query = new URLSearchParams({
                    page: String(page),
                    pageSize: String(pageSize),
                    sortField,
                    sortDirection,
                });

                if (selectedUserId !== "all") query.set("userId", selectedUserId);
                if (selectedModule !== "all") query.set("module", selectedModule);
                if (selectedAction !== "all") query.set("action", selectedAction);
                if (searchQuery.trim()) query.set("search", searchQuery.trim());
                if (fromDate) query.set("from", fromDate);
                if (toDate) query.set("to", toDate);

                const response = await fetch(`/api/audit-logs?${query.toString()}`);
                const payload = await response.json();

                if (!response.ok) {
                    throw new Error(payload?.error || "Failed to load audit logs.");
                }

                setRows(payload.data ?? []);
                setUsers(payload.users ?? []);
                setPagination(payload.pagination ?? { page, pageSize, total: 0, totalPages: 1 });
            } catch (error) {
                console.error("Error loading audit logs:", error);
                setRows([]);
            } finally {
                setLoading(false);
            }
        },
        [fromDate, pageSize, searchQuery, selectedAction, selectedModule, selectedUserId, sortDirection, sortField, toDate],
    );

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void fetchRows(currentPage);
    }, [currentPage, fetchRows]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
            setCurrentPage(1);
            return;
        }

        setSortField(field);
        setSortDirection(field === "createdAt" ? "desc" : "asc");
        setCurrentPage(1);
    };

    const handleUserFilterChange = (value: string | null) => {
        setSelectedUserId(value ?? "all");
        setCurrentPage(1);
    };

    const handleModuleFilterChange = (value: string | null) => {
        setSelectedModule(value ?? "all");
        setCurrentPage(1);
    };

    const handleActionFilterChange = (value: string | null) => {
        setSelectedAction(value ?? "all");
        setCurrentPage(1);
    };

    const handleFromDateChange = (value: string) => {
        setFromDate(value);
        setCurrentPage(1);
    };

    const handleToDateChange = (value: string) => {
        setToDate(value);
        setCurrentPage(1);
    };

    const sortIcon = (field: SortField) =>
        sortField === field ? (sortDirection === "asc" ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />) : null;

    const selectedUser = users.find((user) => user.userId === selectedUserId);
    const selectedModuleLabel = selectedModule === "all" ? "All modules" : selectedModule;
    const selectedActionLabel = selectedAction === "all" ? "All actions" : formatAuditAction(selectedAction);

    const emptyState = (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <IconZoomExclamation />
                </EmptyMedia>
                <EmptyTitle>No audit logs</EmptyTitle>
                <EmptyDescription>No matching activities were found.</EmptyDescription>
            </EmptyHeader>
        </Empty>
    );

    return (
        <div className="space-y-6">
            <GlobalHeader title="Audit Log" description="Review user activity across the application." />

            <div className="grid gap-3 rounded-lg border border-input bg-card p-4 lg:grid-cols-3">
                <div className="relative lg:col-span-3">
                    <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(event) => {
                            setSearchQuery(event.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search user, module, action, description, or resource ID..."
                        className="pl-9"
                    />
                </div>

                <Select value={selectedUserId} onValueChange={handleUserFilterChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue>{selectedUser ? selectedUser.userName : "All users"}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="w-full">
                        <SelectItem value="all">All users</SelectItem>
                        {users.map((user) => (
                            <SelectItem key={user.userId} value={user.userId}>
                                {user.userName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedModule} onValueChange={handleModuleFilterChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue>{selectedModuleLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="w-full">
                        <SelectItem value="all">All modules</SelectItem>
                        {Object.values(AUDIT_MODULES).map((moduleName) => (
                            <SelectItem key={moduleName} value={moduleName}>
                                {moduleName}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={selectedAction} onValueChange={handleActionFilterChange}>
                    <SelectTrigger className="w-full">
                        <SelectValue>{selectedActionLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent className="w-full">
                        <SelectItem value="all">All actions</SelectItem>
                        {AUDIT_ACTIONS.map((action) => (
                            <SelectItem key={action} value={action}>
                                {formatAuditAction(action)}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Input type="date" value={fromDate} onChange={(event) => handleFromDateChange(event.target.value)} />
                <Input type="date" value={toDate} onChange={(event) => handleToDateChange(event.target.value)} />
            </div>

            {loading ? (
                <div className="rounded-lg border border-input bg-card p-6 text-sm text-muted-foreground">Loading audit logs...</div>
            ) : rows.length === 0 ? (
                emptyState
            ) : (
                <div className="space-y-4">
                    <div className="overflow-hidden rounded-lg border border-input bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>No</TableHead>
                                    <TableHead>
                                        <Button type="button" variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => handleSort("userName")}>
                                            User {sortIcon("userName")}
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button type="button" variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => handleSort("createdAt")}>
                                            Timestamp {sortIcon("createdAt")}
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button type="button" variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => handleSort("module")}>
                                            Module {sortIcon("module")}
                                        </Button>
                                    </TableHead>
                                    <TableHead>
                                        <Button type="button" variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => handleSort("action")}>
                                            Action {sortIcon("action")}
                                        </Button>
                                    </TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row, index) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{(pagination.page - 1) * pagination.pageSize + index + 1}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{row.userName}</div>
                                            <div className="text-xs text-muted-foreground">#{row.userId}</div>
                                        </TableCell>
                                        <TableCell>{new Date(row.createdAt).toLocaleString("id-ID")}</TableCell>
                                        <TableCell>{row.module}</TableCell>
                                        <TableCell>
                                            <Badge className={getAuditActionBadgeClass(row.action)}>{formatAuditAction(row.action)}</Badge>
                                        </TableCell>
                                        <TableCell>{row.description || "-"}</TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/dashboard/log/${row.id}`}>
                                                <Button size="sm" variant="outline">
                                                    View
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>

                            {Array.from({ length: pagination.totalPages }, (_, index) => index + 1)
                                .slice(Math.max(0, currentPage - 3), Math.min(pagination.totalPages, currentPage + 2))
                                .map((pageNumber) => (
                                    <PaginationItem key={pageNumber}>
                                        <PaginationLink
                                            isActive={pageNumber === currentPage}
                                            onClick={() => setCurrentPage(pageNumber)}
                                            className="cursor-pointer"
                                        >
                                            {pageNumber}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}

                            <PaginationItem>
                                <PaginationNext
                                    onClick={() => setCurrentPage((page) => Math.min(pagination.totalPages, page + 1))}
                                    className={currentPage >= pagination.totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </div>
    );
}
