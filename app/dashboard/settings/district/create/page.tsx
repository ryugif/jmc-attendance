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
import { create } from "@/app/dashboard/settings/district/actions"
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

export default function CreateDistrictPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [regencies, setRegencies] = useState<RegencyOption[]>([])

    const {
        register,
        handleSubmit,
        formState: { errors },
        control,
    } = useForm<DistrictFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            isActive: true,
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
                setError("Failed to load regencies. Please try again.")
            }
        }

        fetchRegencies()
    }, [])

    const onSubmit = async (data: DistrictFormData) => {
        setIsLoading(true)
        setError(null)
        try {
            await create({
                name: data.name,
                description: data.description,
                regencyId: data.regencyId,
                isActive: data.isActive,
            })
            router.push("/dashboard/settings/district")
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to create district"
            setError(errorMessage)
            console.error("Error creating district:", err)
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
                title="Create New District"
                description="Add a new district to your organization."
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
                                        placeholder="e.g., North District"
                                        {...register("name")}
                                        aria-invalid={!!errors.name}
                                    />
                                </FieldContent>
                                <FieldError errors={errors.name ? [errors.name] : []} />
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
                                        placeholder="Enter a brief description of the district (optional)"
                                        {...register("description")}
                                        aria-invalid={!!errors.description}
                                    />
                                </FieldContent>
                                <FieldError
                                    errors={errors.description ? [errors.description] : []}
                                />
                            </Field>

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
                            {isLoading ? "Saving..." : "Save District"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}