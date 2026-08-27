"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
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
    create,
    getDepartmentOptions,
    getJobPositionOptions,
    getRoleOptions,
} from "@/app/dashboard/users/actions";

const schema = z.object({
    name: z.string().min(1, "Full name is required").max(255, "Full name must not exceed 255 characters"),
    email: z.string().trim().email("Please enter a valid email").max(255, "Email must not exceed 255 characters"),
    username: z.string().trim().min(3, "Username must be at least 3 characters").max(255, "Username must not exceed 255 characters"),
    phoneNumber: z.string().max(50, "Phone number must not exceed 50 characters").optional().or(z.literal("")),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long.")
        .max(128, "Password must not exceed 128 characters.")
        .refine((value) => !/\s/.test(value), "Password cannot contain spaces.")
        .refine((value) => /[A-Z]/.test(value), "Password must include at least 1 uppercase letter.")
        .refine((value) => /[a-z]/.test(value), "Password must include at least 1 lowercase letter.")
        .refine((value) => /[^A-Za-z0-9\s]/.test(value), "Password must include at least 1 special character."),
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

const generatePassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const specials = "!@#$%^&*()-_=+[]{};:,.<>?/";
    const pool = lowercase + uppercase + numbers + specials;

    const required = [
        lowercase[Math.floor(Math.random() * lowercase.length)],
        uppercase[Math.floor(Math.random() * uppercase.length)],
        specials[Math.floor(Math.random() * specials.length)],
    ];

    const rest = Array.from({ length: 8 }, () => pool[Math.floor(Math.random() * pool.length)]);
    const candidate = [...required, ...rest].sort(() => Math.random() - 0.5).join("");

    if (
        candidate.length >= 8 &&
        !/\s/.test(candidate) &&
        /[A-Z]/.test(candidate) &&
        /[a-z]/.test(candidate) &&
        /[^A-Za-z0-9]/.test(candidate)
    ) {
        return candidate;
    }

    return generatePassword();
};

export default function CreateUserPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [jobPositions, setJobPositions] = useState<JobPositionOption[]>([]);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        reset,
        setValue,
    } = useForm<UserFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            isActive: true,
            departmentId: "",
            jobPositionId: "",
            phoneNumber: "",
            employeeCode: "",
        },
    });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [roleResult, departmentResult, jobPositionResult] = await Promise.all([
                    getRoleOptions(),
                    getDepartmentOptions(),
                    getJobPositionOptions(),
                ]);

                setRoles(roleResult);
                setDepartments(departmentResult);
                setJobPositions(jobPositionResult);

                if (roleResult[0]) {
                    reset({
                        name: "",
                        email: "",
                        username: "",
                        phoneNumber: "",
                        password: "",
                        roleId: roleResult[0].id,
                        departmentId: "",
                        jobPositionId: "",
                        employeeCode: "",
                        isActive: true,
                    });
                }
            } catch (err) {
                console.error("Error loading options:", err);
                setError("Failed to load user form options.");
            }
        };

        void fetchOptions();
    }, [reset]);

    const passwordValue = useWatch({ control, name: "password" }) ?? "";
    const passwordRules = [
        { label: "Minimum 8 characters", met: passwordValue.length >= 8 },
        { label: "No spaces", met: !/\s/.test(passwordValue) },
        { label: "At least 1 uppercase letter", met: /[A-Z]/.test(passwordValue) },
        { label: "At least 1 lowercase letter", met: /[a-z]/.test(passwordValue) },
        { label: "At least 1 special character", met: /[^A-Za-z0-9\s]/.test(passwordValue) },
    ];

    const onSubmit = async (data: UserFormData) => {
        setLoading(true);
        setError(null);

        try {
            await create({
                name: data.name,
                email: data.email,
                username: data.username,
                password: data.password,
                phoneNumber: data.phoneNumber || undefined,
                roleId: data.roleId,
                departmentId: data.departmentId || undefined,
                jobPositionId: data.jobPositionId || undefined,
                employeeCode: data.employeeCode || undefined,
                isActive: data.isActive,
            });
            router.push("/dashboard/users");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to create user.";
            setError(message);
            console.error("Error creating user:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => router.back();

    return (
        <div className="flex flex-col gap-6">
            <GlobalHeader title="Create User" description="Add a new user to the system." />

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
                                <FieldLabel htmlFor="password">Password</FieldLabel>
                                <FieldContent>
                                    <div className="flex gap-2">
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Minimum 8 characters"
                                            {...register("password")}
                                            aria-invalid={!!errors.password}
                                            className="flex-1"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setValue("password", generatePassword(), { shouldValidate: true, shouldDirty: true })}
                                        >
                                            Generate Password
                                        </Button>
                                    </div>
                                </FieldContent>
                                <FieldError errors={errors.password ? [errors.password] : []} />
                                <div className="mt-2 rounded-md border border-input bg-muted/30 p-2">
                                    <p className="mb-2 text-xs font-medium text-muted-foreground">Password requirements</p>
                                    <ul className="space-y-1 text-xs">
                                        {passwordRules.map((rule) => (
                                            <li
                                                key={rule.label}
                                                className={`flex items-center gap-2 rounded px-1 ${rule.met ? "text-emerald-600" : "text-muted-foreground"}`}
                                            >
                                                <span
                                                    className={`inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] ${rule.met ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/40 bg-transparent text-muted-foreground"
                                                        }`}
                                                >
                                                    {rule.met ? "✓" : "•"}
                                                </span>
                                                <span>{rule.label}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
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
                            {loading ? "Creating..." : "Create User"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
