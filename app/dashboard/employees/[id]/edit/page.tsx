"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useParams, useRouter } from "next/navigation";

import GlobalHeader from "@/components/global-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldContent, FieldError, FieldLabel, FieldSet } from "@/components/ui/field";
import { getDepartmentOptions, getDistrictOptions, getEmployeeDetail, getProvinceOptions, getRegencyOptions, updateEmployee } from "@/app/dashboard/employees/actions";

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
    age: z.coerce.number().min(0),
    maritalStatus: z.enum(["Married", "Not Married"]),
    numberOfChildren: z.coerce.number().min(0).max(99),
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

const baseEducation = { level: "", schoolName: "", graduationYear: new Date().getFullYear() };

function toDateInputValue(value: string | Date | null | undefined) {
    if (!value) {
        return "";
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toISOString().slice(0, 10);
}

export default function EditEmployeePage() {
    const router = useRouter();
    const params = useParams();
    const employeeId = params.id as string;
    const [pageLoading, setPageLoading] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [provinces, setProvinces] = useState<DepartmentOption[]>([]);
    const [regencies, setRegencies] = useState<DepartmentOption[]>([]);
    const [districts, setDistricts] = useState<DepartmentOption[]>([]);
    const [provinceSearch, setProvinceSearch] = useState("");
    const [regencySearch, setRegencySearch] = useState("");
    const [districtSearch, setDistrictSearch] = useState("");
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);

    const { register, control, handleSubmit, setValue, formState: { errors } } = useForm({
        resolver: zodResolver(employeeSchema),
        defaultValues: {
            nip: "",
            name: "",
            email: "",
            phoneNumber: "",
            placeOfBirth: "",
            districtId: "",
            districtName: "",
            regencyId: "",
            regencyName: "",
            provinceId: "",
            provinceName: "",
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
            education: [baseEducation],
        } satisfies z.input<typeof employeeSchema>,
    });

    const { fields, append, remove } = useFieldArray({ control, name: "education" });
    const dateOfBirth = useWatch({ control, name: "dateOfBirth" });
    const provinceId = useWatch({ control, name: "provinceId" });
    const regencyId = useWatch({ control, name: "regencyId" });
    const districtId = useWatch({ control, name: "districtId" });
    const activeProvinceId = provinceId ?? "";
    const activeRegencyId = regencyId ?? "";
    const activeDistrictId = districtId ?? "";

    useEffect(() => {
        const fetchPage = async () => {
            try {
                const [departmentResult, provinceResult, detailResult] = await Promise.all([
                    getDepartmentOptions(),
                    getProvinceOptions(),
                    getEmployeeDetail(employeeId),
                ]);

                setDepartments(departmentResult);
                setProvinces(provinceResult);

                const employee = detailResult.data as unknown as {
                    photoUrl?: string | null;
                    nip?: string;
                    name?: string;
                    email?: string;
                    phoneNumber?: string;
                    placeOfBirth?: string;
                    districtId?: string;
                    districtName?: string;
                    regencyId?: string;
                    regencyName?: string | null;
                    provinceId?: string;
                    provinceName?: string | null;
                    fullAddress?: string;
                    homeToOfficeDistance?: number;
                    dateOfBirth?: string | Date | null;
                    age?: number;
                    maritalStatus?: "Married" | "Not Married";
                    numberOfChildren?: number;
                    joinDate?: string | Date | null;
                    position?: "Manager" | "Staff" | "Intern";
                    departmentId?: string;
                    contractStatus?: "Permanent" | "Contract" | "Internship" | "Probation";
                    status?: "Active" | "Inactive";
                    education?: Array<{ level: string; schoolName: string; graduationYear: number }>;
                };

                setPhotoPreview(employee.photoUrl ?? null);
                setValue("nip", employee.nip ?? "");
                setValue("name", employee.name ?? "");
                setValue("email", employee.email ?? "");
                setValue("phoneNumber", employee.phoneNumber ?? "");
                setValue("placeOfBirth", employee.placeOfBirth ?? "");
                setValue("districtId", employee.districtId ?? "");
                setValue("districtName", employee.districtName ?? "");
                setValue("regencyId", employee.regencyId ?? "");
                setValue("regencyName", employee.regencyName ?? "");
                setValue("provinceId", employee.provinceId ?? "");
                setValue("provinceName", employee.provinceName ?? "");
                setValue("fullAddress", employee.fullAddress ?? "");
                setValue("homeToOfficeDistance", Number(employee.homeToOfficeDistance ?? 0));
                setValue("dateOfBirth", toDateInputValue(employee.dateOfBirth));
                setValue("age", Number(employee.age ?? 0));
                setValue("maritalStatus", employee.maritalStatus ?? "Married");
                setValue("numberOfChildren", Number(employee.numberOfChildren ?? 0));
                setValue("joinDate", toDateInputValue(employee.joinDate));
                setValue("position", employee.position ?? "Staff");
                setValue("departmentId", employee.departmentId ?? "");
                setValue("contractStatus", employee.contractStatus ?? "Permanent");
                setValue("status", employee.status ?? "Active");
                setValue("education", Array.isArray(employee.education) && employee.education.length
                    ? employee.education.map((item) => ({
                        level: item.level,
                        schoolName: item.schoolName,
                        graduationYear: Number(item.graduationYear),
                    }))
                    : [{ ...baseEducation }]);

                if (employee.provinceId) {
                    const provinceOptions = await getRegencyOptions(employee.provinceId);
                    setRegencies(provinceOptions);
                }

                if (employee.regencyId) {
                    const districtOptions = await getDistrictOptions(employee.regencyId);
                    setDistricts(districtOptions);
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : "Failed to load employee details.";
                setError(message);
            } finally {
                setPageLoading(false);
            }
        };

        if (employeeId) {
            void fetchPage();
        }
    }, [employeeId, setValue]);

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
    const filteredProvinces = provinces.filter((item) => item.name.toLowerCase().includes(provinceSearch.toLowerCase()));
    const filteredRegencies = regencies.filter((item) => item.name.toLowerCase().includes(regencySearch.toLowerCase()));
    const filteredDistricts = districts.filter((item) => item.name.toLowerCase().includes(districtSearch.toLowerCase()));
    const selectedProvince = provinces.find((item) => item.id === activeProvinceId);
    const selectedRegency = regencies.find((item) => item.id === activeRegencyId);
    const selectedDistrict = districts.find((item) => item.id === activeDistrictId);

    const selectDistrict = (nextDistrictId: string) => {
        const selectedDistrict = districts.find((item) => item.id === nextDistrictId);
        setValue("districtId", nextDistrictId, { shouldDirty: true, shouldValidate: true });
        setValue("districtName", selectedDistrict?.name ?? "", { shouldDirty: true, shouldValidate: true });
    };

    const selectRegency = (nextRegencyId: string) => {
        const selectedRegency = regencies.find((item) => item.id === nextRegencyId);
        setValue("regencyId", nextRegencyId, { shouldDirty: true, shouldValidate: true });
        setValue("regencyName", selectedRegency?.name ?? "", { shouldDirty: true, shouldValidate: true });
        setValue("districtId", "", { shouldDirty: true, shouldValidate: true });
        setValue("districtName", "", { shouldDirty: true, shouldValidate: true });
        setRegencySearch("");
        setDistrictSearch("");
        setDistricts([]);
    };

    const selectProvince = (nextProvinceId: string) => {
        const selectedProvince = provinces.find((item) => item.id === nextProvinceId);
        setValue("provinceId", nextProvinceId, { shouldDirty: true, shouldValidate: true });
        setValue("provinceName", selectedProvince?.name ?? "", { shouldDirty: true, shouldValidate: true });
        setValue("regencyId", "", { shouldDirty: true, shouldValidate: true });
        setValue("regencyName", "", { shouldDirty: true, shouldValidate: true });
        setValue("districtId", "", { shouldDirty: true, shouldValidate: true });
        setValue("districtName", "", { shouldDirty: true, shouldValidate: true });
        setProvinceSearch("");
        setRegencySearch("");
        setDistrictSearch("");
        setRegencies([]);
        setDistricts([]);
    };

    const onSubmit = async (data: z.output<typeof employeeSchema>) => {
        setLoading(true);
        setError(null);

        try {
            const nextPhotoUrl = photoFile ? await fileToDataUrl(photoFile) : undefined;
            await updateEmployee(employeeId, {
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
            const message = err instanceof Error ? err.message : "Failed to update employee.";
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
            setPhotoPreview(typeof reader.result === "string" ? reader.result : null);
        };
        reader.readAsDataURL(file);
        setPhotoFile(file);
    };

    if (pageLoading) {
        return <div className="rounded-lg border border-input bg-card p-6 text-center">Loading employee information...</div>;
    }

    return (
        <div className="flex flex-col gap-6">
            <GlobalHeader title="Edit Employee" description="Update the selected employee profile and education history." />

            <div className="rounded-lg border border-input bg-card p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {error && (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                    )}

                    <FieldSet>
                        <div className="grid gap-5 md:grid-cols-2">
                            <Field>
                                <FieldLabel htmlFor="photo">Employee Photo</FieldLabel>
                                <FieldContent>
                                    <div className="flex items-center gap-4">
                                        <div className="flex size-20 items-center justify-center overflow-hidden rounded-full border border-input bg-muted text-sm text-muted-foreground">
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
                                    <Input id="name" {...register("name")} aria-invalid={!!errors.name} />
                                </FieldContent>
                                <FieldError errors={errors.name ? [errors.name] : []} />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="email">Email</FieldLabel>
                                <FieldContent>
                                    <Input id="email" type="email" {...register("email")} aria-invalid={!!errors.email} />
                                </FieldContent>
                                <FieldError errors={errors.email ? [errors.email] : []} />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="phoneNumber">Phone Number</FieldLabel>
                                <FieldContent>
                                    <Input id="phoneNumber" {...register("phoneNumber")} aria-invalid={!!errors.phoneNumber} />
                                </FieldContent>
                                <FieldError errors={errors.phoneNumber ? [errors.phoneNumber] : []} />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="placeOfBirth">Place of Birth</FieldLabel>
                                <FieldContent>
                                    <Input id="placeOfBirth" {...register("placeOfBirth")} aria-invalid={!!errors.placeOfBirth} />
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
                                                    selectProvince(nextValue);
                                                }}
                                                disabled={provinces.length === 0}
                                            >
                                                <SelectTrigger id="provinceId" className="w-full" aria-invalid={!!errors.provinceId}>
                                                    <SelectValue>{selectedProvince?.name ?? "Select province"}</SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <div className="border-b border-input p-2">
                                                        <Input
                                                            placeholder="Search province"
                                                            value={provinceSearch}
                                                            onChange={(event) => setProvinceSearch(event.target.value)}
                                                            onPointerDown={(event) => event.stopPropagation()}
                                                            onKeyDown={(event) => event.stopPropagation()}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    {filteredProvinces.length > 0 ? filteredProvinces.map((item) => (
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
                                                    selectRegency(nextValue);
                                                }}
                                                disabled={!activeProvinceId || regencies.length === 0}
                                            >
                                                <SelectTrigger id="regencyId" className="w-full" aria-invalid={!!errors.regencyId}>
                                                    <SelectValue>{selectedRegency?.name ?? (activeProvinceId ? "Select regency" : "Select province first")}</SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <div className="border-b border-input p-2">
                                                        <Input
                                                            placeholder="Search regency"
                                                            value={regencySearch}
                                                            onChange={(event) => setRegencySearch(event.target.value)}
                                                            onPointerDown={(event) => event.stopPropagation()}
                                                            onKeyDown={(event) => event.stopPropagation()}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    {filteredRegencies.length > 0 ? filteredRegencies.map((item) => (
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
                                                    selectDistrict(nextValue);
                                                }}
                                                disabled={!activeRegencyId || districts.length === 0}
                                            >
                                                <SelectTrigger id="districtId" className="w-full" aria-invalid={!!errors.districtId}>
                                                    <SelectValue>{selectedDistrict?.name ?? (activeRegencyId ? "Select district" : "Select regency first")}</SelectValue>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <div className="border-b border-input p-2">
                                                        <Input
                                                            placeholder="Search district"
                                                            value={districtSearch}
                                                            onChange={(event) => setDistrictSearch(event.target.value)}
                                                            onPointerDown={(event) => event.stopPropagation()}
                                                            onKeyDown={(event) => event.stopPropagation()}
                                                            autoFocus
                                                        />
                                                    </div>
                                                    {filteredDistricts.length > 0 ? filteredDistricts.map((item) => (
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
                                        <label className="flex items-center gap-2"><input type="radio" value="Married" {...register("maritalStatus")} />Married</label>
                                        <label className="flex items-center gap-2"><input type="radio" value="Not Married" {...register("maritalStatus")} />Not Married</label>
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
                                <FieldLabel>Position</FieldLabel>
                                <FieldContent>
                                    <Controller name="position" control={control} render={({ field }) => (
                                        <select value={field.value} onChange={(event) => field.onChange(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                                            <option value="Manager">Manager</option>
                                            <option value="Staff">Staff</option>
                                            <option value="Intern">Intern</option>
                                        </select>
                                    )} />
                                </FieldContent>
                                <FieldError errors={errors.position ? [errors.position] : []} />
                            </Field>

                            <Field>
                                <FieldLabel>Department</FieldLabel>
                                <FieldContent>
                                    <Controller name="departmentId" control={control} render={({ field }) => (
                                        <select value={field.value} onChange={(event) => field.onChange(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                                            <option value="">Select department</option>
                                            {departments.map((dept) => (
                                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                                            ))}
                                        </select>
                                    )} />
                                </FieldContent>
                                <FieldError errors={errors.departmentId ? [errors.departmentId] : []} />
                            </Field>

                            <Field>
                                <FieldLabel>Contract Status</FieldLabel>
                                <FieldContent>
                                    <Controller name="contractStatus" control={control} render={({ field }) => (
                                        <select value={field.value} onChange={(event) => field.onChange(event.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                                            <option value="Permanent">Permanent</option>
                                            <option value="Contract">Contract</option>
                                            <option value="Internship">Internship</option>
                                            <option value="Probation">Probation</option>
                                        </select>
                                    )} />
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel>Status</FieldLabel>
                                <FieldContent>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2"><input type="radio" value="Active" {...register("status")} />Active</label>
                                        <label className="flex items-center gap-2"><input type="radio" value="Inactive" {...register("status")} />Inactive</label>
                                    </div>
                                </FieldContent>
                                <FieldError errors={errors.status ? [errors.status] : []} />
                            </Field>
                        </div>

                        <div className="space-y-4 rounded-md border border-input p-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-medium">Education</h3>
                                <Button type="button" variant="outline" onClick={() => append({ ...baseEducation, graduationYear: new Date().getFullYear() })}>Add Education</Button>
                            </div>

                            {fields.map((field, index) => (
                                <div key={field.id} className="grid gap-3 rounded-md border border-input p-3 md:grid-cols-[1fr_1.5fr_0.8fr_auto]">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Level</label>
                                        <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register(`education.${index}.level` as const)} />
                                        <FieldError errors={errors.education?.[index]?.level ? [errors.education[index].level] : []} />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">School Name</label>
                                        <input className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register(`education.${index}.schoolName` as const)} />
                                        <FieldError errors={errors.education?.[index]?.schoolName ? [errors.education[index].schoolName] : []} />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">Grad. Year</label>
                                        <input type="number" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" {...register(`education.${index}.graduationYear` as const)} />
                                        <FieldError errors={errors.education?.[index]?.graduationYear ? [errors.education[index].graduationYear] : []} />
                                    </div>
                                    <div className="flex items-end">
                                        <Button type="button" variant="destructive" onClick={() => remove(index)} disabled={fields.length === 1}>Remove</Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </FieldSet>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>
                        <Button type="submit" disabled={loading}>{loading ? "Updating..." : "Update Employee"}</Button>
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
