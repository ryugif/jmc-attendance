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
import { getDetail, update } from "@/app/dashboard/settings/district/actions"
import { getList as getRegencyList } from "@/app/dashboard/settings/regency/actions"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
} from "@/components/ui/select"

const schema = z.object({
    name: z
        .string()
        .min(1, "District name is required")
        .min(3, "District name must be at least 3 characters")
        .max(255, "District name must not exceed 255 characters"),
    description: z
        .string()
        .max(1000, "Description must not exceed 1000 characters")
        .optional()
        .or(z.literal("")),
    regencyId: z.string().min(1, "Please select a regency"),
    isActive: z.boolean().optional(),
})

type DistrictFormData = z.infer<typeof schema>

interface RegencyOption {
    id: string
    name: string
}

interface DistrictData {
    id: string
    name: string
    regencyId: string
    description: string | null
    isActive: boolean
}

export default function UpdateDistrictPage() {
    const router = useRouter()
    const params = useParams()
    const districtId = params.id as string

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPageLoading, setIsPageLoading] = useState(true)
    const [district, setDistrict] = useState<DistrictData | null>(null)
    const [regencies, setRegencies] = useState<RegencyOption[]>([])

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        control,
    } = useForm<DistrictFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            isActive: false,
        },
    })

    useEffect(() => {
        const fetchRegencies = async () => {
            try {
                const result = await getRegencyList(1, 1000)
                if (result.success) {
                    setRegencies((result.data as RegencyOption[]) ?? [])
                }
            } catch (err) {
                console.error("Error fetching regencies:", err)
            }
        }

        fetchRegencies()
    }, [])

    useEffect(() => {
        const fetchDistrict = async () => {
            try {
                setIsPageLoading(true)
                const result = await getDetail(districtId)
                if (result.success) {
                    const dist = result.data.district as unknown as DistrictData
                    setDistrict(dist)
                    setValue("name", dist.name)
                    setValue("description", dist.description || "")
                    setValue("regencyId", dist.regencyId)
                    setValue("isActive", dist.isActive)
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load district"
                setError(errorMessage)
                console.error("Error fetching district:", err)
            } finally {
                setIsPageLoading(false)
            }
        }

        if (districtId) {
            fetchDistrict()
        }
    }, [districtId, setValue])

    const onSubmit = async (data: DistrictFormData) => {
        setIsLoading(true)
        setError(null)
        try {
            await update(districtId, {
                name: data.name,
                description: data.description,
                regencyId: data.regencyId,
                isActive: data.isActive,
            })
            router.push("/dashboard/settings/district")
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to update district"
            setError(errorMessage)
            console.error("Error updating district:", err)
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
                    title="Update District"
                    description="Edit district details."
                />
                <div className="rounded-lg border border-input bg-card p-6 text-center">
                    Loading district data...
                </div>
            </div>
        )
    }

    if (!district) {
        return (
            <div className="flex flex-col gap-6">
                <GlobalHeader
                    title="Update District"
                    description="Edit district details."
                />
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
                    District not found. Please go back and select a valid district.
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <GlobalHeader
                title="Update District"
                description={`Edit details for "${district.name}".`}
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
                            <Field>
                                <FieldLabel htmlFor="name">District Name</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Central District"
                                        {...register("name")}
                                    />
                                    {errors.name && (
                                        <FieldError>{errors.name.message}</FieldError>
                                    )}
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="regencyId">Regency</FieldLabel>
                                <FieldContent>
                                    <Controller
                                        name="regencyId"
                                        control={control}
                                        render={({ field }) => {
                                            const selectedRegencyName =
                                                regencies.find((regency) => regency.id === field.value)?.name ??
                                                "Select a regency"

                                            return (
                                                <Select
                                                    value={field.value || ""}
                                                    onValueChange={field.onChange}
                                                    disabled={regencies.length === 0}
                                                >
                                                    <SelectTrigger
                                                        id="regencyId"
                                                        className="w-full"
                                                        aria-invalid={!!errors.regencyId}
                                                    >
                                                        <span className="truncate">
                                                            {regencies.length > 0
                                                                ? selectedRegencyName
                                                                : "No regencies available"}
                                                        </span>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {regencies.map((regency) => (
                                                            <SelectItem
                                                                key={regency.id}
                                                                value={regency.id}
                                                                aria-label={regency.name}
                                                            >
                                                                {regency.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )
                                        }}
                                    />
                                </FieldContent>
                                <FieldError
                                    errors={errors.regencyId ? [errors.regencyId] : []}
                                />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="description">Description</FieldLabel>
                                <FieldContent>
                                    <Textarea
                                        id="description"
                                        placeholder="Enter district description..."
                                        {...register("description")}
                                        rows={4}
                                    />
                                    {errors.description && (
                                        <FieldError>{errors.description.message}</FieldError>
                                    )}
                                </FieldContent>
                            </Field>

                            <Field>
                                <FieldLabel className="flex items-center gap-2">
                                    <Controller
                                        name="isActive"
                                        control={control}
                                        render={({ field }) => (
                                            <Checkbox
                                                id="isActive"
                                                checked={!!field.value}
                                                onCheckedChange={(checked) =>
                                                    field.onChange(checked === true)
                                                }
                                            />
                                        )}
                                    />
                                    Active
                                </FieldLabel>
                            </Field>
                        </FieldGroup>
                    </FieldSet>

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
                            {isLoading ? "Updating..." : "Update District"}
                        </Button>
                    </div>
                </form>
            </div>
            <span className="text-sm text-muted-foreground">ID: {districtId}</span>
        </div>
    )
}
