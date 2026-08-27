"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import GlobalHeader from "@/components/global-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Field,
    FieldGroup,
    FieldLabel,
    FieldContent,
    FieldError,
    FieldSet,
} from "@/components/ui/field"
import { getDetail, update } from "@/app/dashboard/settings/regency/actions"
import { getList as getProvinceList } from "@/app/dashboard/settings/province/actions"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select"

// Validation schema
const schema = z.object({
    name: z
        .string()
        .min(1, "Regency name is required")
        .min(3, "Regency name must be at least 3 characters")
        .max(255, "Regency name must not exceed 255 characters"),
    description: z
        .string()
        .max(1000, "Description must not exceed 1000 characters")
        .optional()
        .or(z.literal("")),
    provinceId: z.string().min(1, "Please select a province"),
    isActive: z.boolean().optional(),
})

type RegencyFormData = z.infer<typeof schema>

interface ProvinceOption {
    id: string
    name: string
}

interface RegencyData {
    id: string
    name: string
    provinceId: string
    description: string | null
    isActive: boolean
}

export default function UpdateRegencyPage() {
    const router = useRouter()
    const params = useParams()
    const regencyId = params.id as string

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPageLoading, setIsPageLoading] = useState(true)
    const [regency, setRegency] = useState<RegencyData | null>(null)
    const [provinces, setProvinces] = useState<ProvinceOption[]>([])

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        control,
    } = useForm<RegencyFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            isActive: false,
        },
    })

    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const result = await getProvinceList(1, 1000)
                if (result.success) {
                    setProvinces((result.data as ProvinceOption[]) ?? [])
                }
            } catch (err) {
                console.error("Error fetching provinces:", err)
            }
        }

        fetchProvinces()
    }, [])

    // Fetch regency data on mount
    useEffect(() => {
        const fetchRegency = async () => {
            try {
                setIsPageLoading(true)
                const result = await getDetail(regencyId)
                if (result.success) {
                    const reg = result.data.regency as unknown as RegencyData
                    setRegency(reg)
                    // Pre-fill form with existing data
                    setValue("name", reg.name)
                    setValue("description", reg.description || "")
                    setValue("provinceId", reg.provinceId)
                    setValue("isActive", reg.isActive)
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load regency"
                setError(errorMessage)
                console.error("Error fetching regency:", err)
            } finally {
                setIsPageLoading(false)
            }
        }

        if (regencyId) {
            fetchRegency()
        }
    }, [regencyId, setValue])

    const onSubmit = async (data: RegencyFormData) => {
        setIsLoading(true)
        setError(null)
        try {
            await update(regencyId, {
                name: data.name,
                description: data.description,
                provinceId: data.provinceId,
                isActive: data.isActive,
            })
            router.push("/dashboard/settings/regency")
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to update regency"
            setError(errorMessage)
            console.error("Error updating regency:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        router.back()
    }

    if (isPageLoading) {
        return (
            <div className="flex flex-col gap-6">
                <GlobalHeader
                    title="Update Regency"
                    description="Edit regency details."
                />
                <div className="rounded-lg border border-input bg-card p-6 text-center">
                    Loading regency data...
                </div>
            </div>
        )
    }

    if (!regency) {
        return (
            <div className="flex flex-col gap-6">
                <GlobalHeader
                    title="Update Regency"
                    description="Edit regency details."
                />
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
                    Regency not found. Please go back and select a valid regency.
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <GlobalHeader
                title="Update Regency"
                description={`Edit details for "${regency.name}".`}
            />

            <div className="rounded-lg border border-input bg-card p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {error && (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                            {error}
                        </div>
                    )}

                    <FieldSet>
                        <FieldGroup>
                            {/* Regency Name Field */}
                            <Field>
                                <FieldLabel htmlFor="name">Regency Name</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Central Regency"
                                        {...register("name")}
                                    />
                                    {errors.name && (
                                        <FieldError>{errors.name.message}</FieldError>
                                    )}
                                </FieldContent>
                            </Field>

                            {/* Province Field */}
                            <Field>
                                <FieldLabel htmlFor="provinceId">Province</FieldLabel>
                                <FieldContent>
                                    <Controller
                                        name="provinceId"
                                        control={control}
                                        render={({ field }) => {
                                            const selectedProvinceName =
                                                provinces.find((province) => province.id === field.value)
                                                    ?.name ?? "Select a province"

                                            return (
                                                <Select
                                                    value={field.value || ""}
                                                    onValueChange={field.onChange}
                                                    disabled={provinces.length === 0}
                                                >
                                                    <SelectTrigger
                                                        id="provinceId"
                                                        className="w-full"
                                                        aria-invalid={!!errors.provinceId}
                                                    >
                                                        <span className="truncate">
                                                            {provinces.length > 0
                                                                ? selectedProvinceName
                                                                : "No provinces available"}
                                                        </span>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {provinces.map((province) => (
                                                            <SelectItem
                                                                key={province.id}
                                                                value={province.id}
                                                                aria-label={province.name}
                                                            >
                                                                {province.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )
                                        }}
                                    />
                                </FieldContent>
                                <FieldError
                                    errors={errors.provinceId ? [errors.provinceId] : []}
                                />
                            </Field>

                            {/* Description Field */}
                            <Field>
                                <FieldLabel htmlFor="description">Description</FieldLabel>
                                <FieldContent>
                                    <Textarea
                                        id="description"
                                        placeholder="Enter regency description..."
                                        {...register("description")}
                                        rows={4}
                                    />
                                    {errors.description && (
                                        <FieldError>{errors.description.message}</FieldError>
                                    )}
                                </FieldContent>
                            </Field>

                            {/* Active Status Field */}
                            <Field>
                                <FieldLabel className="flex items-center gap-2">
                                    <Controller
                                        name="isActive"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox
                                                id="isActive"
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        )}
                                    />
                                    Active
                                </FieldLabel>
                            </Field>
                        </FieldGroup>
                    </FieldSet>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? "Updating..." : "Update Regency"}
                        </Button>
                    </div>
                </form>
            </div>
            <span className="text-sm text-muted-foreground">ID: {regencyId}</span>
        </div>
    )
}
