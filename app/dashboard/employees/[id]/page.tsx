"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import GlobalHeader from "@/components/global-header";
import { getEmployeeDetail } from "@/app/dashboard/employees/actions";

interface EmployeeDetails {
    id: string;
    nip: string;
    name: string;
    email: string;
    phoneNumber: string;
    photoUrl?: string | null;
    placeOfBirth: string;
    districtName: string;
    regencyName: string;
    provinceName: string;
    fullAddress: string;
    homeToOfficeDistance: number;
    dateOfBirth: string;
    age: number;
    gender: "Male" | "Female";
    maritalStatus: "Married" | "Not Married";
    numberOfChildren: number;
    joinDate: string;
    departmentName: string | null;
    position: "Manager" | "Staff" | "Intern";
    contractStatus: "Permanent" | "Contract" | "Internship" | "Probation";
    status: "Active" | "Inactive";
    education: Array<{ id: string; level: string; schoolName: string; graduationYear: number }>;
}

function normalizeEmployeeDetails(data: Record<string, unknown>): EmployeeDetails {
    const details = data as Partial<EmployeeDetails> & {
        dateOfBirth?: string | Date | null;
        joinDate?: string | Date | null;
    };

    const toStringDate = (value: string | Date | null | undefined) => {
        if (!value) {
            return "";
        }

        const date = value instanceof Date ? value : new Date(value);
        return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
    };

    return {
        ...details,
        id: String(details.id ?? ""),
        nip: String(details.nip ?? ""),
        name: String(details.name ?? ""),
        email: String(details.email ?? ""),
        phoneNumber: String(details.phoneNumber ?? ""),
        photoUrl: details.photoUrl ?? null,
        placeOfBirth: String(details.placeOfBirth ?? ""),
        districtName: String(details.districtName ?? ""),
        regencyName: String(details.regencyName ?? ""),
        provinceName: String(details.provinceName ?? ""),
        fullAddress: String(details.fullAddress ?? ""),
        homeToOfficeDistance: Number(details.homeToOfficeDistance ?? 0),
        dateOfBirth: toStringDate(details.dateOfBirth),
        age: Number(details.age ?? 0),
        gender: (details.gender as EmployeeDetails["gender"]) ?? "Male",
        maritalStatus: (details.maritalStatus as EmployeeDetails["maritalStatus"]) ?? "Married",
        numberOfChildren: Number(details.numberOfChildren ?? 0),
        joinDate: toStringDate(details.joinDate),
        departmentName: details.departmentName ?? null,
        position: (details.position as EmployeeDetails["position"]) ?? "Staff",
        contractStatus: (details.contractStatus as EmployeeDetails["contractStatus"]) ?? "Permanent",
        status: (details.status as EmployeeDetails["status"]) ?? "Active",
        education: Array.isArray(details.education) ? details.education as EmployeeDetails["education"] : [],
    };
}

export default function EmployeeDetailPage() {
    const params = useParams();
    const employeeId = params.id as string;
    const [employee, setEmployee] = useState<EmployeeDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmployee = async () => {
            try {
                const result = await getEmployeeDetail(employeeId);
                setEmployee(normalizeEmployeeDetails(result.data as Record<string, unknown>));
            } catch (error) {
                console.error("Error loading employee detail:", error);
            } finally {
                setLoading(false);
            }
        };

        if (employeeId) {
            void fetchEmployee();
        }
    }, [employeeId]);

    if (loading) {
        return <div className="rounded-lg border border-input bg-card p-6 text-center">Loading employee details...</div>;
    }

    if (!employee) {
        return <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">Employee not found.</div>;
    }

    return (
        <div className="space-y-6">
            <GlobalHeader title="Employee Detail" description={`View the complete profile for ${employee.name}.`} />

            <div className="rounded-lg border border-input bg-card p-6">
                <div className="w-full flex flex-col gap-8">
                    <div className="flex items-start justify-start">
                        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-input bg-muted text-sm text-muted-foreground">
                            {employee.photoUrl ? (
                                <Image src={employee.photoUrl} alt={employee.name} width={128} height={128} className="h-full w-full object-cover" />
                            ) : (
                                "Avatar"
                            )}
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 w-full">
                        <DetailItem label="NIP" value={employee.nip} />
                        <DetailItem label="Name" value={employee.name} />
                        <DetailItem label="Email" value={employee.email} />
                        <DetailItem label="Phone" value={employee.phoneNumber} />
                        <DetailItem label="Place of Birth" value={employee.placeOfBirth} />
                        <DetailItem label="District" value={employee.districtName} />
                        <DetailItem label="Regency" value={employee.regencyName} />
                        <DetailItem label="Province" value={employee.provinceName} />
                        <DetailItem label="Home-to-Office Distance" value={`${employee.homeToOfficeDistance} km`} />
                        <DetailItem label="Date of Birth" value={employee.dateOfBirth} />
                        <DetailItem label="Age" value={String(employee.age)} />
                        <DetailItem label="Gender" value={employee.gender} />
                        <DetailItem label="Marital Status" value={employee.maritalStatus} />
                        <DetailItem label="Children" value={String(employee.numberOfChildren)} />
                        <DetailItem label="Join Date" value={employee.joinDate} />
                        <DetailItem label="Position" value={employee.position} />
                        <DetailItem label="Department" value={employee.departmentName ?? "-"} />
                        <DetailItem label="Contract Status" value={employee.contractStatus} />
                        <DetailItem label="Status" value={employee.status} />
                        <div className="md:col-span-2">
                            <div className="text-sm font-medium text-muted-foreground">Address</div>
                            <div className="mt-1 text-sm">{employee.fullAddress}</div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h3 className="text-lg font-medium">Education History</h3>
                    {employee.education.length > 0 ? (
                        <div className="mt-3 overflow-hidden rounded-lg border border-input">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-muted/40">
                                    <tr>
                                        <th className="px-3 py-2">Level</th>
                                        <th className="px-3 py-2">School Name</th>
                                        <th className="px-3 py-2">Graduation Year</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employee.education.map((item) => (
                                        <tr key={item.id} className="border-t border-input">
                                            <td className="px-3 py-2">{item.level}</td>
                                            <td className="px-3 py-2">{item.schoolName}</td>
                                            <td className="px-3 py-2">{item.graduationYear}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="mt-3 rounded-md border border-dashed border-input p-4 text-sm text-muted-foreground">No education records available.</div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DetailItem({ label, value }: { label: string; value: string | Date | number | null | undefined }) {
    const displayValue = value instanceof Date ? value.toLocaleDateString() : value ?? "-";

    return (
        <div>
            <div className="text-sm font-medium text-muted-foreground">{label}</div>
            <div className="mt-1 text-sm">{displayValue || "-"}</div>
        </div>
    );
}
