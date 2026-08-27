"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconChevronDown, IconChevronUp, IconDotsCircleHorizontal, IconPlus, IconSearch, IconX, IconZoomExclamation } from "@tabler/icons-react";

import GlobalHeader from "@/components/global-header";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { deleteItem, getList, search } from "@/app/dashboard/users/actions";

interface UserRecord {
    id: string;
    name: string;
    email: string;
    username: string;
    phoneNumber: string | null;
    employeeCode: string | null;
    isActive: boolean;
    roleId: string | null;
    departmentId: string | null;
    jobPositionId: string | null;
    createdAt: Date;
    updatedAt: Date;
    roleName: string | null;
    departmentName: string | null;
    jobPositionName: string | null;
}

interface PaginationData {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

type SortField = "name" | "username" | "status";
type SortDirection = "asc" | "desc";

const addButton = (
    <Link href="/dashboard/users/create">
        <Button size="lg" className="flex items-center gap-2">
            <IconPlus size={16} />
            Add User
        </Button>
    </Link>
);

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [pagination, setPagination] = useState<PaginationData>({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
    });
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<UserRecord | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const requestIdRef = useRef(0);
    const initialLoadRef = useRef(true);

    const pageSize = 10;

    const fetchUsers = async (page: number, query: string = "") => {
        const requestId = ++requestIdRef.current;
        const searching = Boolean(query.trim());

        try {
            setLoading(true);
            let result;

            if (searching) {
                result = await search(query, page, pageSize);
            } else {
                result = await getList(page, pageSize);
            }

            if (requestId !== requestIdRef.current) {
                return;
            }

            setIsSearching(searching);

            if (result.success) {
                setUsers(result.data);
                setPagination(result.pagination);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        void fetchUsers(1);
    }, []);

    useEffect(() => {
        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            return;
        }

        const timeoutId = window.setTimeout(() => {
            void fetchUsers(1, searchQuery);
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [searchQuery]);

    const handlePageChange = (newPage: number) => {
        void fetchUsers(newPage, searchQuery);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
    };

    const handleDeleteClick = (user: UserRecord) => {
        setUserToDelete(user);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;

        setIsDeleting(true);
        try {
            await deleteItem(userToDelete.id);
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            void fetchUsers(pagination.page, searchQuery);
        } catch (error) {
            console.error("Error deleting user:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to delete user";
            alert(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection((previous) => (previous === "asc" ? "desc" : "asc"));
            return;
        }

        setSortField(field);
        setSortDirection("asc");
    };

    const sortedUsers = [...users].sort((left, right) => {
        const direction = sortDirection === "asc" ? 1 : -1;

        switch (sortField) {
            case "name":
                return left.name.localeCompare(right.name) * direction;
            case "username":
                return left.username.localeCompare(right.username) * direction;
            case "status":
                return Number(left.isActive) === Number(right.isActive) ? 0 : (Number(left.isActive) > Number(right.isActive) ? 1 : -1) * direction;
            default:
                return 0;
        }
    });

    const renderPaginationItems = () => {
        const items: ReactNode[] = [];
        const { page, totalPages } = pagination;

        if (page > 1) {
            items.push(
                <PaginationItem key="prev">
                    <PaginationPrevious onClick={() => handlePageChange(page - 1)} className="cursor-pointer" />
                </PaginationItem>,
            );
        }

        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(totalPages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink isActive={i === page} onClick={() => handlePageChange(i)} className="cursor-pointer">
                        {i}
                    </PaginationLink>
                </PaginationItem>,
            );
        }

        if (page < totalPages) {
            items.push(
                <PaginationItem key="next">
                    <PaginationNext onClick={() => handlePageChange(page + 1)} className="cursor-pointer" />
                </PaginationItem>,
            );
        }

        return items;
    };

    const emptyState = isSearching ? (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <IconZoomExclamation />
                </EmptyMedia>
                <EmptyTitle>No users found</EmptyTitle>
                <EmptyDescription>No users match your search.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>{addButton}</EmptyContent>
        </Empty>
    ) : (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <IconZoomExclamation />
                </EmptyMedia>
                <EmptyTitle>No users</EmptyTitle>
                <EmptyDescription>No users have been added yet.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>{addButton}</EmptyContent>
        </Empty>
    );

    return (
        <div className="space-y-6">
            <GlobalHeader title="Users" description="Manage application users and their assignments." />

            <div className="flex items-center justify-between gap-4">
                <div className="relative w-full">
                    <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={searchQuery}
                        onChange={(event) => handleSearch(event.target.value)}
                        placeholder="Search users, email, username, or employee code..."
                        className="pl-9"
                    />
                </div>

                {searchQuery && (
                    <Button variant="ghost" size="icon" onClick={handleClearSearch} aria-label="Clear search">
                        <IconX size={16} />
                    </Button>
                )}

                {addButton}
            </div>

            {loading ? (
                <div className="rounded-lg border border-input bg-card p-6 text-center text-sm text-muted-foreground">
                    Loading users...
                </div>
            ) : users.length === 0 ? (
                emptyState
            ) : (
                <div className="rounded-lg border border-input bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>No</TableHead>
                                <TableHead>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 font-medium"
                                        onClick={() => handleSort("name")}
                                    >
                                        <span>Name</span>
                                        {sortField === "name" && (sortDirection === "asc" ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />)}
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 font-medium"
                                        onClick={() => handleSort("username")}
                                    >
                                        <span>Username</span>
                                        {sortField === "username" && (sortDirection === "asc" ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />)}
                                    </Button>
                                </TableHead>
                                <TableHead>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-0 font-medium"
                                        onClick={() => handleSort("status")}
                                    >
                                        <span>Status</span>
                                        {sortField === "status" && (sortDirection === "asc" ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />)}
                                    </Button>
                                </TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {sortedUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>#{users.indexOf(user) + 1}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-xs text-muted-foreground">{user.employeeCode || "No employee code"}</div>
                                    </TableCell>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${user.isActive ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700"}`}>
                                            {user.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger>
                                                <Button variant="ghost" size="icon" aria-label={`Open actions for ${user.name}`}>
                                                    <IconDotsCircleHorizontal size={16} />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => router.push(`/dashboard/users/${user.id}/edit`)}>
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => handleDeleteClick(user)} variant="destructive">
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="border-t border-input px-4 py-3">
                        <Pagination>
                            <PaginationContent className="justify-end">
                                {renderPaginationItems()}
                            </PaginationContent>
                        </Pagination>
                    </div>
                </div>
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogTitle>Delete user</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action will permanently delete {userToDelete?.name ?? "this user"}. This cannot be undone.
                    </AlertDialogDescription>
                    <div className="mt-4 flex justify-end gap-3">
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}