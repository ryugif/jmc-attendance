"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { IconDotsCircleHorizontal, IconPlus, IconSearch, IconX, IconZoomExclamation } from "@tabler/icons-react"
import GlobalHeader from "@/components/global-header"
import Link from "next/link"
import { getList, search, deleteItem } from "@/app/dashboard/settings/district/actions"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

interface District {
    id: string;
    name: string;
    description: string | null;
    code: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface PaginationData {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

const addButton = (
    <Link href="/dashboard/settings/district/create">
        <Button size="lg" className="flex items-center gap-2">
            <IconPlus size={16} />
            Add District
        </Button>
    </Link>
);

export default function DistrictSettingsPage() {
    const [districts, setDistricts] = useState<District[]>([]);
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
    const [districtToDelete, setDistrictToDelete] = useState<District | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const requestIdRef = useRef(0);
    const initialLoadRef = useRef(true);

    const pageSize = 10;

    const fetchDistricts = async (page: number, query: string = "") => {
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
                setDistricts(result.data);
                setPagination(result.pagination);
            }
        } catch (error) {
            console.error("Error fetching districts:", error);
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            void fetchDistricts(1);
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            return;
        }

        const timeoutId = window.setTimeout(() => {
            fetchDistricts(1, searchQuery);
        }, 300);

        return () => window.clearTimeout(timeoutId);
    }, [searchQuery]);

    const handlePageChange = (newPage: number) => {
        fetchDistricts(newPage, searchQuery);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
    };

    const handleDeleteClick = (district: District) => {
        setDistrictToDelete(district);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!districtToDelete) return;

        setIsDeleting(true);
        try {
            await deleteItem(districtToDelete.id);
            setDeleteDialogOpen(false);
            setDistrictToDelete(null);
            fetchDistricts(pagination.page, searchQuery);
        } catch (error) {
            console.error("Error deleting district:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to delete district";
            alert(errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    const renderPaginationItems = () => {
        const items = [];
        const { page, totalPages } = pagination;

        if (page > 1) {
            items.push(
                <PaginationItem key="prev">
                    <PaginationPrevious
                        onClick={() => handlePageChange(page - 1)}
                        className="cursor-pointer"
                    />
                </PaginationItem>
            );
        }

        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(totalPages, page + 2);

        for (let i = startPage; i <= endPage; i++) {
            items.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        isActive={i === page}
                        onClick={() => handlePageChange(i)}
                        className="cursor-pointer"
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        }

        if (page < totalPages) {
            items.push(
                <PaginationItem key="next">
                    <PaginationNext
                        onClick={() => handlePageChange(page + 1)}
                        className="cursor-pointer"
                    />
                </PaginationItem>
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
                <EmptyTitle>No districts found</EmptyTitle>
                <EmptyDescription>No districts found matching your search</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>{addButton}</EmptyContent>
        </Empty>
    ) : (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <IconZoomExclamation />
                </EmptyMedia>
                <EmptyTitle>No districts</EmptyTitle>
                <EmptyDescription>No districts have been added yet.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>{addButton}</EmptyContent>
        </Empty>
    );

    return (
        <div className="space-y-6">
            <GlobalHeader title="Districts" description="Manage the districts within your organization." />

            <div className="flex items-center justify-between gap-4">
                <div className="relative w-full">
                    <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 size-5" />
                    <Input
                        placeholder="Search districts by name or description"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10 pr-10"
                    />
                    {searchQuery && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <IconX className="size-5" />
                        </button>
                    )}
                </div>
                {addButton}
            </div>

            <Table className="border">
                <TableHeader className="bg-zinc-100">
                    <TableRow>
                        <TableHead className="text-black">Name</TableHead>
                        <TableHead className="text-black">Description</TableHead>
                        <TableHead className="text-right text-black">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-8">
                                Loading...
                            </TableCell>
                        </TableRow>
                    ) : districts.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={3} className="text-center py-8">
                                {emptyState}
                            </TableCell>
                        </TableRow>
                    ) : (
                        districts.map((district) => (
                            <TableRow key={district.id}>
                                <TableCell className="font-medium">{district.name}</TableCell>
                                <TableCell>{district.description || "-"}</TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-8"><IconDotsCircleHorizontal /><span className="sr-only">Open menu</span></Button>} />
                                        <DropdownMenuContent align="end">
                                            <Link href={`/dashboard/settings/district/${district.id}/edit`}>
                                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                            </Link>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                variant="destructive"
                                                onClick={() => handleDeleteClick(district)}
                                            >
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>

            {pagination.totalPages > 1 && (
                <div className="flex justify-center">
                    <Pagination>
                        <PaginationContent>
                            {renderPaginationItems()}
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogTitle>Delete District</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete <strong>{districtToDelete?.name}</strong>? This action cannot be undone.
                    </AlertDialogDescription>
                    <div className="flex gap-3 justify-end pt-4">
                        <AlertDialogCancel disabled={isDeleting}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
