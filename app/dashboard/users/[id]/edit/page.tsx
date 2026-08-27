"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import GlobalHeader from "@/components/global-header";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Field,
    FieldContent,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    getDepartmentOptions,
    getDetail,
    getJobPositionOptions,
    getRoleOptions,
    update,
} from "@/app/dashboard/users/actions";

const schema = z.object({
    name: z.string().min(1, "Full name is required").max(255, "Full name must not exceed 255 characters"),
    email: z.string().trim().email("Please enter a valid email").max(255, "Email must not exceed 255 characters"),
    username: z.string().trim().min(3, "Username must be at least 3 characters").max(255, "Username must not exceed 255 characters"),
    phoneNumber: z.string().max(50, "Phone number must not exceed 50 characters").optional().or(z.literal("")),
    roleId: z.string().min(1, "Please select a role"),
    departmentId: z.string().optional().or(z.literal("")),
    jobPositionId: z.string().optional().or(z.literal("")),
    employeeCode: z.string().max(50, "Employee code must not exceed 50 characters").optional().or(z.literal("")),
    isActive: z.boolean().optional(),
});

type UserFormData = z.infer<typeof schema>;

interface RoleOption {
    id: string;
    name: string;
}

interface DepartmentOption {
    id: string;
    name: string;
}

interface JobPositionOption {
    id: string;
    name: string;
    departmentId: string | null;
}

export default function EditUserPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [jobPositions, setJobPositions] = useState<JobPositionOption[]>([]);
    const [user, setUser] = useState<{ id: string; name: string } | null>(null);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        setValue,
    } = useForm<UserFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            isActive: true,
            departmentId: "",
            jobPositionId: "",
            phoneNumber: "",
            employeeCode: "",
            roleId: "",
        },
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                setPageLoading(true);
                const [roleResult, departmentResult, jobPositionResult, detailResult] = await Promise.all([
                    getRoleOptions(),
                    getDepartmentOptions(),
                    getJobPositionOptions(),
                    getDetail(userId),
                ]);

                setRoles(roleResult);
                setDepartments(departmentResult);
                setJobPositions(jobPositionResult);

                const nextUser = detailResult.data;
                setUser({ id: nextUser.id, name: nextUser.name });
                setValue("name", nextUser.name ?? "");
                setValue("email", nextUser.email ?? "");
                setValue("username", nextUser.username ?? "");
                setValue("phoneNumber", nextUser.phoneNumber ?? "");
                setValue("roleId", nextUser.roleId ?? roleResult[0]?.id ?? "");
                setValue("departmentId", nextUser.departmentId ?? "");
                setValue("jobPositionId", nextUser.jobPositionId ?? "");
                setValue("employeeCode", nextUser.employeeCode ?? "");
                setValue("isActive", nextUser.isActive ?? true);
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to load user details.";
                setError(message);
                console.error("Error loading user details:", err);
            } finally {
                setPageLoading(false);
            }
        };

        if (userId) {
            void fetchData();
        }
    }, [setValue, userId]);

    const onSubmit = async (data: UserFormData) => {
        setLoading(true);
        setError(null);

        try {
            await update(userId, {
                name: data.name,
                email: data.email,
                username: data.username,
                phoneNumber: data.phoneNumber || undefined,
                roleId: data.roleId,
                departmentId: data.departmentId || undefined,
                jobPositionId: data.jobPositionId || undefined,
                employeeCode: data.employeeCode || undefined,
                isActive: data.isActive,
            });
            router.push("/dashboard/users");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to update user.";
            setError(message);
            console.error("Error updating user:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => router.back();

    if (pageLoading) {
        return (
            <div className="flex flex-col gap-6">
                <GlobalHeader title="Update User" description="Loading user details." />
                <div className="rounded-lg border border-input bg-card p-6 text-center">Loading user data...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col gap-6">
                <GlobalHeader title="Update User" description="Edit user details." />
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
                    User not found. Please return to the users list and select a valid user.
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <GlobalHeader title="Update User" description={`Edit details for ${user.name}.`} />

            <div className="rounded-lg border border-input bg-card p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {error && (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <FieldSet>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="name">Full Name</FieldLabel>
                                <FieldContent>
                                    <Input id="name" placeholder="e.g. Jane Doe" {...register("name")} aria-invalid={!!errors.name} />
                                </FieldContent>
                                <FieldError errors={errors.name ? [errors.name] : []} />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="username">Username</FieldLabel>
                                <FieldContent>
                                    <Input id="username" placeholder="e.g. janedoe" {...register("username")} aria-invalid={!!errors.username} />
                                </FieldContent>
                                <FieldError errors={errors.username ? [errors.username] : []} />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <FieldContent>
                                    <Input id="email" type="email" placeholder="user@example.com" {...register("email")} aria-invalid={!!errors.email} />
                                </FieldContent>
                                <FieldError errors={errors.email ? [errors.email] : []} />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="phoneNumber">Phone Number</FieldLabel>
                                <FieldContent>
                                    <Input id="phoneNumber" placeholder="081234567890" {...register("phoneNumber")} aria-invalid={!!errors.phoneNumber} />
                                </FieldContent>
                                <FieldError errors={errors.phoneNumber ? [errors.phoneNumber] : []} />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="roleId">Role</FieldLabel>
                                <FieldContent>
                                    <Controller
                                        name="roleId"
                                        control={control}
                                        render={({ field }) => (
                                            <Select value={field.value || ""} onValueChange={field.onChange} disabled={roles.length === 0}>
                                                <SelectTrigger id="roleId" className="w-full" aria-invalid={!!errors.roleId}>
                                                    <SelectValue>
                                                        {(value) => {
                                                            const label = roles.find((role) => role.id === value)?.name;
                                                            return label ?? (roles.length > 0 ? "Select a role" : "No roles available");
                                                        }}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles.map((role) => (
                                                        <SelectItem key={role.id} value={role.id}>
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </FieldContent>
                                <FieldError errors={errors.roleId ? [errors.roleId] : []} />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="departmentId">Department</FieldLabel>
                                <FieldContent>
                                    <Controller
                                        name="departmentId"
                                        control={control}
                                        render={({ field }) => (
                                            <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                                <SelectTrigger id="departmentId" className="w-full">
                                                    <SelectValue>
                                                        {(value) => {
                                                            if (!value) return "Select a department";
                                                            const label = departments.find((department) => department.id === value)?.name;
                                                            return label ?? "Select a department";
                                                        }}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">None</SelectItem>
                                                    {departments.map((department) => (
                                                        <SelectItem key={department.id} value={department.id}>
                                                            {department.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="jobPositionId">Job Position</FieldLabel>
                                <FieldContent>
                                    <Controller
                                        name="jobPositionId"
                                        control={control}
                                        render={({ field }) => (
                                            <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                                <SelectTrigger id="jobPositionId" className="w-full">
                                                    <SelectValue>
                                                        {(value) => {
                                                            if (!value) return "Select a job position";
                                                            const label = jobPositions.find((position) => position.id === value)?.name;
                                                            return label ?? "Select a job position";
                                                        }}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="">None</SelectItem>
                                                    {jobPositions.map((position) => (
                                                        <SelectItem key={position.id} value={position.id}>
                                                            {position.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="employeeCode">Employee Code</FieldLabel>
                                <FieldContent>
                                    <Input id="employeeCode" placeholder="EMP-001" {...register("employeeCode")} aria-invalid={!!errors.employeeCode} />
                                </FieldContent>
                                <FieldError errors={errors.employeeCode ? [errors.employeeCode] : []} />
                            </Field>

                            <Field>
                                <FieldContent className="flex flex-row items-center gap-2">
                                    <Controller
                                        name="isActive"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox id="isActive" checked={!!field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                                        )}
                                    />
                                    <FieldLabel htmlFor="isActive">Active User</FieldLabel>
                                </FieldContent>
                            </Field>
                        </FieldGroup>
                    </FieldSet>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save User"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
