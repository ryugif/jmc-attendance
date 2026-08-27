"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";

import GlobalHeader from "@/components/global-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { createEmployee, getDepartmentOptions, getDistrictOptions, getProvinceOptions, getRegencyOptions } from "@/app/dashboard/employees/actions";
import { IconTrash } from "@tabler/icons-react";

const educationSchema = z.object({
    level: z.string().min(1, "Education level is required"),
    schoolName: z.string().min(1, "School name is required"),
    graduationYear: z.coerce.number().min(1900, "Graduation year is invalid").max(2100, "Graduation year is invalid"),
});

const employeeSchema = z.object({
    nip: z.string().min(8, "NIP must be at least 8 numeric characters").regex(/^\d+$/, "NIP must contain only numeric characters without spaces"),
    name: z.string().trim().min(1, "Employee name is required").regex(/^[A-Za-z0-9' ]+$/, "Name may only contain letters, numbers, apostrophes, and spaces"),
    email: z.string().trim().email("Please enter a valid email"),
    phoneNumber: z.string().trim().regex(/^\+[1-9]\d{7,14}$/, "Phone number must use international format, e.g. +6282218458888"),
    photoUrl: z.string().optional(),
    placeOfBirth: z.string().trim().min(1, "Place of birth is required"),
    districtId: z.string().optional(),
    districtName: z.string().trim().min(1, "District is required"),
    regencyId: z.string().optional(),
    regencyName: z.string().trim().min(1, "Regency is required"),
    provinceId: z.string().optional(),
    provinceName: z.string().trim().min(1, "Province is required"),
    fullAddress: z.string().trim().min(1, "Full address is required"),
    homeToOfficeDistance: z.coerce.number().min(0, "Distance must be positive").max(99, "Distance must be max 2 digits"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    age: z.coerce.number().min(0, "Age is invalid"),
    maritalStatus: z.enum(["Married", "Not Married"]),
    numberOfChildren: z.coerce.number().min(0, "Number of children cannot be negative").max(99, "Number of children must be max 2 digits"),
    joinDate: z.string().min(1, "Join date is required"),
    position: z.enum(["Manager", "Staff", "Intern"]),
    departmentId: z.string().min(1, "Department is required"),
    contractStatus: z.enum(["Permanent", "Contract", "Internship", "Probation"]),
    status: z.enum(["Active", "Inactive"]),
    education: z.array(educationSchema).min(1, "At least one education record is required"),
});

interface DepartmentOption {
    id: string;
    name: string;
}

const emptyEducationRecord = { level: "", schoolName: "", graduationYear: new Date().getFullYear() };
const educationLevelOptions = ["SD", "SMP", "SMA", "SMK", "D1", "D2", "D3", "D4", "S1", "S2", "S3"];

export default function CreateEmployeePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [provinces, setProvinces] = useState<DepartmentOption[]>([]);
    const [regencies, setRegencies] = useState<DepartmentOption[]>([]);
    const [districts, setDistricts] = useState<DepartmentOption[]>([]);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    const { register, control, handleSubmit, formState: { errors }, setValue } = useForm({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            nip: "",
            name: "",
            email: "",
            phoneNumber: "",
            placeOfBirth: "",
            provinceId: "",
            provinceName: "",
            regencyId: "",
            regencyName: "",
            districtId: "",
            districtName: "",
            fullAddress: "",
            homeToOfficeDistance: 0,
            dateOfBirth: "",
            age: 0,
            maritalStatus: "Married",
            numberOfChildren: 0,
            joinDate: "",
            position: "Staff",
            departmentId: "",
            contractStatus: "Permanent",
            status: "Active",
            education: [emptyEducationRecord],
        } satisfies z.input<typeof employeeSchema>,
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "education",
    });

    const dateOfBirth = useWatch({ control, name: "dateOfBirth" });
    const provinceId = useWatch({ control, name: "provinceId" });
    const regencyId = useWatch({ control, name: "regencyId" });
    const districtId = useWatch({ control, name: "districtId" });
    const activeProvinceId = provinceId ?? "";
    const activeRegencyId = regencyId ?? "";
    const activeDistrictId = districtId ?? "";

    useEffect(() => {
        if (!dateOfBirth) {
            setValue("age", 0, { shouldDirty: true, shouldValidate: true });
            return;
        }

        const birthDate = new Date(dateOfBirth);
        if (Number.isNaN(birthDate.getTime())) {
            setValue("age", 0, { shouldDirty: true, shouldValidate: true });
            return;
        }

        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age -= 1;
        }

        setValue("age", Math.max(age, 0), { shouldDirty: true, shouldValidate: true });
    }, [dateOfBirth, setValue]);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const result = await getDepartmentOptions();
                setDepartments(result);
            } catch {
                setError("Failed to load departments.");
            }
        };

        const fetchProvinces = async () => {
            try {
                const result = await getProvinceOptions();
                setProvinces(result);
            } catch {
                setError("Failed to load provinces.");
            }
        };

        void fetchDepartments();
        void fetchProvinces();
    }, []);

    useEffect(() => {
        if (!activeProvinceId) {
            return;
        }

        void (async () => {
            try {
                const result = await getRegencyOptions(activeProvinceId);
                setRegencies(result);
            } catch {
                setRegencies([]);
            }
        })();
    }, [activeProvinceId]);

    useEffect(() => {
        if (!activeRegencyId) {
            return;
        }

        void (async () => {
            try {
                const result = await getDistrictOptions(activeRegencyId);
                setDistricts(result);
            } catch {
                setDistricts([]);
            }
        })();
    }, [activeRegencyId]);

    const ageValue = Number(useWatch({ control, name: "age" }) ?? 0);

    const onSubmit = async (data: z.output<typeof employeeSchema>) => {
        setLoading(true);
        setError(null);

        try {
            const nextPhotoUrl = photoFile ? await fileToDataUrl(photoFile) : undefined;

            await createEmployee({
                nip: data.nip,
                name: data.name,
                email: data.email,
                phoneNumber: data.phoneNumber,
                photoUrl: nextPhotoUrl,
                placeOfBirth: data.placeOfBirth,
                districtId: data.districtId,
                districtName: data.districtName,
                regencyId: data.regencyId,
                regencyName: data.regencyName,
                provinceId: data.provinceId,
                provinceName: data.provinceName,
                fullAddress: data.fullAddress,
                homeToOfficeDistance: Number(data.homeToOfficeDistance),
                dateOfBirth: data.dateOfBirth,
                maritalStatus: data.maritalStatus,
                numberOfChildren: Number(data.numberOfChildren),
                joinDate: data.joinDate,
                position: data.position,
                departmentId: data.departmentId,
                contractStatus: data.contractStatus,
                status: data.status,
                education: data.education,
            });

            router.push("/dashboard/employees");
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to create employee.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
            setError("Photo must be PNG, JPG, or JPEG.");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            const result = typeof reader.result === "string" ? reader.result : null;
            setPhotoPreview(result);
        };
        reader.readAsDataURL(file);
        setPhotoFile(file);
        setError(null);
    };

    const selectedProvince = provinces.find((item) => item.id === activeProvinceId);
    const selectedRegency = regencies.find((item) => item.id === activeRegencyId);
    const selectedDistrict = districts.find((item) => item.id === activeDistrictId);

    return (
        <div className="flex flex-col gap-6">
            <GlobalHeader title="Add Employee" description="Create a new employee record with contact, assignment, and education details." />

            <div className="rounded-lg border border-input bg-card p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {error && (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <FieldSet>
                        <FieldGroup>
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field>
                                    <FieldLabel htmlFor="photo">Employee Photo</FieldLabel>
                                    <FieldContent>
                                        <div className="flex items-center gap-4">
                                            <div className="flex size-20 items-center justify-center overflow-hidden border border-input bg-muted text-sm text-muted-foreground">
                                                {photoPreview ? (
                                                    <Image src={photoPreview} alt="Employee preview" width={80} height={80} className="h-full w-full object-cover" />
                                                ) : (
                                                    "No photo"
                                                )}
                                            </div>
                                            <Input id="photo" type="file" accept="image/png,image/jpeg,image/jpg" onChange={handlePhotoChange} />
                                        </div>
                                    </FieldContent>
                                </Field>
                            </div>

                            <div className="grid gap-5 md:grid-cols-2">
                                <Field>
                                    <FieldLabel htmlFor="nip">NIP</FieldLabel>
                                    <FieldContent>
                                        <Input
                                            id="nip"
                                            placeholder="e.g. 2024060101"
                                            inputMode="numeric"
                                            {...register("nip")}
                                            onInput={(event) => {
                                                const target = event.currentTarget;
                                                target.value = target.value.replace(/\D/g, "");
                                            }}
                                            aria-invalid={!!errors.nip}
                                        />
                                    </FieldContent>
                                    <FieldError errors={errors.nip ? [errors.nip] : []} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="name">Employee Name</FieldLabel>
                                    <FieldContent>
                                        <Input id="name" placeholder="e.g. John Doe" {...register("name")} aria-invalid={!!errors.name} />
                                    </FieldContent>
                                    <FieldError errors={errors.name ? [errors.name] : []} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="email">Email</FieldLabel>
                                    <FieldContent>
                                        <Input id="email" type="email" placeholder="employee@example.com" {...register("email")} aria-invalid={!!errors.email} />
                                    </FieldContent>
                                    <FieldError errors={errors.email ? [errors.email] : []} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="phoneNumber">Phone Number</FieldLabel>
                                    <FieldContent>
                                        <Input id="phoneNumber" placeholder="+6282218458888" {...register("phoneNumber")} aria-invalid={!!errors.phoneNumber} />
                                    </FieldContent>
                                    <FieldError errors={errors.phoneNumber ? [errors.phoneNumber] : []} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="placeOfBirth">Place of Birth</FieldLabel>
                                    <FieldContent>
                                        <Input id="placeOfBirth" placeholder="Bandung" {...register("placeOfBirth")} aria-invalid={!!errors.placeOfBirth} />
                                    </FieldContent>
                                    <FieldError errors={errors.placeOfBirth ? [errors.placeOfBirth] : []} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="provinceId">Province</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="provinceId"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value || ""}
                                                    onValueChange={(value) => {
                                                        const nextValue = value ?? "";
                                                        field.onChange(nextValue);
                                                        const selected = provinces.find((item) => item.id === nextValue);
                                                        setRegencies([]);
                                                        setDistricts([]);
                                                        setValue("provinceName", selected?.name ?? "", { shouldDirty: true, shouldValidate: true });
                                                        setValue("regencyId", "", { shouldDirty: true, shouldValidate: true });
                                                        setValue("regencyName", "", { shouldDirty: true, shouldValidate: true });
                                                        setValue("districtId", "", { shouldDirty: true, shouldValidate: true });
                                                        setValue("districtName", "", { shouldDirty: true, shouldValidate: true });
                                                    }}
                                                    disabled={provinces.length === 0}
                                                >
                                                    <SelectTrigger id="provinceId" className="w-full" aria-invalid={!!errors.provinceId}>
                                                        <SelectValue>{selectedProvince?.name ?? "Select province"}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {provinces.length > 0 ? provinces.map((item) => (
                                                            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                                                        )) : (
                                                            <div className="px-3 py-2 text-sm text-muted-foreground">No provinces found</div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </FieldContent>
                                    <FieldError errors={errors.provinceId ? [errors.provinceId] : []} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="regencyId">Regency</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="regencyId"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value || ""}
                                                    onValueChange={(value) => {
                                                        const nextValue = value ?? "";
                                                        field.onChange(nextValue);
                                                        const selected = regencies.find((item) => item.id === nextValue);
                                                        setDistricts([]);
                                                        setValue("regencyName", selected?.name ?? "", { shouldDirty: true, shouldValidate: true });
                                                        setValue("districtId", "", { shouldDirty: true, shouldValidate: true });
                                                        setValue("districtName", "", { shouldDirty: true, shouldValidate: true });
                                                    }}
                                                    disabled={!activeProvinceId || regencies.length === 0}
                                                >
                                                    <SelectTrigger id="regencyId" className="w-full" aria-invalid={!!errors.regencyId}>
                                                        <SelectValue>{selectedRegency?.name ?? (activeProvinceId ? "Select regency" : "Select province first")}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {regencies.length > 0 ? regencies.map((item) => (
                                                            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                                                        )) : (
                                                            <div className="px-3 py-2 text-sm text-muted-foreground">No regencies found</div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </FieldContent>
                                    <FieldError errors={errors.regencyId ? [errors.regencyId] : []} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="districtId">District</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="districtId"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    value={field.value || ""}
                                                    onValueChange={(value) => {
                                                        const nextValue = value ?? "";
                                                        field.onChange(nextValue);
                                                        const selected = districts.find((item) => item.id === nextValue);
                                                        setValue("districtName", selected?.name ?? "", { shouldDirty: true, shouldValidate: true });
                                                    }}
                                                    disabled={!activeRegencyId || districts.length === 0}
                                                >
                                                    <SelectTrigger id="districtId" className="w-full" aria-invalid={!!errors.districtId}>
                                                        <SelectValue>{selectedDistrict?.name ?? (activeRegencyId ? "Select district" : "Select regency first")}</SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {districts.length > 0 ? districts.map((item) => (
                                                            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                                                        )) : (
                                                            <div className="px-3 py-2 text-sm text-muted-foreground">No districts found</div>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </FieldContent>
                                    <FieldError errors={errors.districtId ? [errors.districtId] : []} />
                                </Field>

                                <Field className="md:col-span-2">
                                    <FieldLabel htmlFor="fullAddress">Full Address</FieldLabel>
                                    <FieldContent>
                                        <Textarea id="fullAddress" rows={4} {...register("fullAddress")} aria-invalid={!!errors.fullAddress} placeholder="Enter employee address" />
                                    </FieldContent>
                                    <FieldError errors={errors.fullAddress ? [errors.fullAddress] : []} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="homeToOfficeDistance">Home-to-Office Distance</FieldLabel>
                                    <FieldContent>
                                        <Input id="homeToOfficeDistance" type="number" min={0} max={99} {...register("homeToOfficeDistance")} aria-invalid={!!errors.homeToOfficeDistance} />
                                    </FieldContent>
                                    <FieldError errors={errors.homeToOfficeDistance ? [errors.homeToOfficeDistance] : []} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="dateOfBirth">Date of Birth</FieldLabel>
                                    <FieldContent>
                                        <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} aria-invalid={!!errors.dateOfBirth} />
                                    </FieldContent>
                                    <FieldError errors={errors.dateOfBirth ? [errors.dateOfBirth] : []} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="age">Age</FieldLabel>
                                    <FieldContent>
                                        <Input id="age" readOnly value={ageValue} className="bg-muted" />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>Marital Status</FieldLabel>
                                    <FieldContent>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2">
                                                <input type="radio" value="Married" {...register("maritalStatus")} />
                                                Married
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input type="radio" value="Not Married" {...register("maritalStatus")} />
                                                Not Married
                                            </label>
                                        </div>
                                    </FieldContent>
                                    <FieldError errors={errors.maritalStatus ? [errors.maritalStatus] : []} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="numberOfChildren">Number of Children</FieldLabel>
                                    <FieldContent>
                                        <Input id="numberOfChildren" type="number" min={0} max={99} {...register("numberOfChildren")} aria-invalid={!!errors.numberOfChildren} />
                                    </FieldContent>
                                    <FieldError errors={errors.numberOfChildren ? [errors.numberOfChildren] : []} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="joinDate">Join Date</FieldLabel>
                                    <FieldContent>
                                        <Input id="joinDate" type="date" {...register("joinDate")} aria-invalid={!!errors.joinDate} />
                                    </FieldContent>
                                    <FieldError errors={errors.joinDate ? [errors.joinDate] : []} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="position">Position</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="position"
                                            control={control}
                                            render={({ field }) => (
                                                <select
                                                    value={field.value}
                                                    onChange={(event) => field.onChange(event.target.value)}
                                                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                >
                                                    <option value="Manager">Manager</option>
                                                    <option value="Staff">Staff</option>
                                                    <option value="Intern">Intern</option>
                                                </select>
                                            )}
                                        />
                                    </FieldContent>
                                    <FieldError errors={errors.position ? [errors.position] : []} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="departmentId">Department</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="departmentId"
                                            control={control}
                                            render={({ field }) => (
                                                <select
                                                    value={field.value}
                                                    onChange={(event) => field.onChange(event.target.value)}
                                                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                >
                                                    <option value="">Select department</option>
                                                    {departments.map((department) => (
                                                        <option key={department.id} value={department.id}>{department.name}</option>
                                                    ))}
                                                </select>
                                            )}
                                        />
                                    </FieldContent>
                                    <FieldError errors={errors.departmentId ? [errors.departmentId] : []} />
                                </Field>

                                <Field>
                                    <FieldLabel htmlFor="contractStatus">Contract Status</FieldLabel>
                                    <FieldContent>
                                        <Controller
                                            name="contractStatus"
                                            control={control}
                                            render={({ field }) => (
                                                <select
                                                    value={field.value}
                                                    onChange={(event) => field.onChange(event.target.value)}
                                                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                >
                                                    <option value="Permanent">Permanent</option>
                                                    <option value="Contract">Contract</option>
                                                    <option value="Internship">Internship</option>
                                                    <option value="Probation">Probation</option>
                                                </select>
                                            )}
                                        />
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>Status</FieldLabel>
                                    <FieldContent>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2">
                                                <input type="radio" value="Active" {...register("status")} />
                                                Active
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input type="radio" value="Inactive" {...register("status")} />
                                                Inactive
                                            </label>
                                        </div>
                                    </FieldContent>
                                    <FieldError errors={errors.status ? [errors.status] : []} />
                                </Field>
                            </div>

                            <div className="space-y-4 rounded-md border border-input p-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-base font-medium">Education</h3>
                                    <Button type="button" variant="outline" onClick={() => append({ ...emptyEducationRecord, graduationYear: new Date().getFullYear() })}>Add Education</Button>
                                </div>

                                {fields.map((field, index) => (
                                    <div key={field.id} className="grid gap-3 rounded-md border border-input p-3 md:grid-cols-[1fr_1.5fr_0.8fr_auto]">
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Level</label>
                                            <Controller
                                                name={`education.${index}.level` as const}
                                                control={control}
                                                render={({ field: levelField }) => (
                                                    <Select value={levelField.value || ""} onValueChange={levelField.onChange}>
                                                        <SelectTrigger className="w-full" aria-invalid={!!errors.education?.[index]?.level}>
                                                            <SelectValue placeholder="Select level" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {educationLevelOptions.map((option) => (
                                                                <SelectItem key={option} value={option}>{option}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            <FieldError errors={errors.education?.[index]?.level ? [errors.education[index].level] : []} />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">School Name</label>
                                            <Input {...register(`education.${index}.schoolName` as const)} placeholder="Enter school name" />
                                            <FieldError errors={errors.education?.[index]?.schoolName ? [errors.education[index].schoolName] : []} />
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-sm font-medium">Grad. Year</label>
                                            <Input type="number" {...register(`education.${index}.graduationYear` as const)} />
                                            <FieldError errors={errors.education?.[index]?.graduationYear ? [errors.education[index].graduationYear] : []} />
                                        </div>
                                        <div className="flex items-end">
                                            <Button size="icon-lg" type="button" variant="destructive" onClick={() => remove(index)} disabled={fields.length === 1}><IconTrash /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FieldGroup>
                    </FieldSet>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Saving..." : "Create Employee"}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function fileToDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
        reader.onerror = () => reject(new Error("Unable to read the selected file."));
        reader.readAsDataURL(file);
    });
}
