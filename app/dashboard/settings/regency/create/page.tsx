"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Controller, useForm } from "react-hook-form"
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
import { create } from "@/app/dashboard/settings/regency/actions"
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

export default function CreateRegencyPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [provinces, setProvinces] = useState<ProvinceOption[]>([])

    const {
        register,
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<RegencyFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            isActive: true,
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
                setError("Failed to load provinces. Please try again.")
            }
        }

        fetchProvinces()
    }, [])

    const onSubmit = async (data: RegencyFormData) => {
        setIsLoading(true)
        setError(null)
        try {
            await create({
                name: data.name,
                description: data.description,
                provinceId: data.provinceId,
                isActive: data.isActive,
            })
            router.push("/dashboard/settings/regency")
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to create regency"
            setError(errorMessage)
            console.error("Error creating regency:", err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleCancel = () => {
        router.back()
    }

    return (
        <div className="flex flex-col gap-6">
            <GlobalHeader
                title="Create New Regency"
                description="Add a new regency to your organization."
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
                                        aria-invalid={!!errors.name}
                                    />
                                </FieldContent>
                                <FieldError errors={errors.name ? [errors.name] : []} />
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
                                        placeholder="Enter a brief description of the regency (optional)"
                                        {...register("description")}
                                        aria-invalid={!!errors.description}
                                    />
                                </FieldContent>
                                <FieldError
                                    errors={errors.description ? [errors.description] : []}
                                />
                            </Field>

                            {/* Active Status Field */}
                            <Field>
                                <FieldContent className="flex items-center gap-2 flex-row">
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
                                    <FieldLabel htmlFor="isActive">Active Status</FieldLabel>
                                </FieldContent>
                                <FieldError
                                    errors={errors.isActive ? [errors.isActive] : []}
                                />
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
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Regency"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}