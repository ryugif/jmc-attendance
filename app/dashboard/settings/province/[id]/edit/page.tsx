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
import { getDetail, update } from "@/app/dashboard/settings/province/actions"
import { Checkbox } from "@/components/ui/checkbox"

// Validation schema
const schema = z.object({
    name: z
        .string()
        .min(1, "Province name is required")
        .min(3, "Province name must be at least 3 characters")
        .max(255, "Province name must not exceed 255 characters"),
    description: z
        .string()
        .max(1000, "Description must not exceed 1000 characters")
        .optional()
        .or(z.literal("")),
    isActive: z.boolean().optional(),
})

type ProvinceFormData = z.infer<typeof schema>

interface ProvinceData {
    id: string
    name: string
    description: string | null
    isActive: boolean
}

export default function UpdateProvincePage() {
    const router = useRouter()
    const params = useParams()
    const provinceId = params.id as string

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPageLoading, setIsPageLoading] = useState(true)
    const [province, setProvince] = useState<ProvinceData | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        control,
    } = useForm<ProvinceFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            isActive: false,
        },
    })

    // Fetch province data on mount
    useEffect(() => {
        const fetchProvince = async () => {
            try {
                setIsPageLoading(true)
                const result = await getDetail(provinceId)
                if (result.success) {
                    const prov = result.data as ProvinceData
                    setProvince(prov)
                    // Pre-fill form with existing data
                    setValue("name", prov.name)
                    setValue("description", prov.description || "")
                    setValue("isActive", prov.isActive)
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load province"
                setError(errorMessage)
                console.error("Error fetching province:", err)
            } finally {
                setIsPageLoading(false)
            }
        }

        if (provinceId) {
            fetchProvince()
        }
    }, [provinceId, setValue])

    const onSubmit = async (data: ProvinceFormData) => {
        setIsLoading(true)
        setError(null)
        try {
            await update(provinceId, {
                name: data.name,
                description: data.description,
                isActive: data.isActive,
            })
            router.push("/dashboard/settings/province")
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to update province"
            setError(errorMessage)
            console.error("Error updating province:", err)
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
                    title="Update Province"
                    description="Edit province details."
                />
                <div className="rounded-lg border border-input bg-card p-6 text-center">
                    Loading province data...
                </div>
            </div>
        )
    }

    if (!province) {
        return (
            <div className="flex flex-col gap-6">
                <GlobalHeader
                    title="Update Province"
                    description="Edit province details."
                />
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
                    Province not found. Please go back and select a valid province.
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <GlobalHeader
                title="Update Province"
                description={`Edit details for "${province.name}".`}
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
                            {/* Province Name Field */}
                            <Field>
                                <FieldLabel htmlFor="name">Province Name</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Central Province"
                                        {...register("name")}
                                    />
                                    {errors.name && (
                                        <FieldError>{errors.name.message}</FieldError>
                                    )}
                                </FieldContent>
                            </Field>

                            {/* Description Field */}
                            <Field>
                                <FieldLabel htmlFor="description">Description</FieldLabel>
                                <FieldContent>
                                    <Textarea
                                        id="description"
                                        placeholder="Enter province description..."
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
                            {isLoading ? "Updating..." : "Update Province"}
                        </Button>
                    </div>
                </form>
            </div>
            <span className="text-sm text-muted-foreground">ID: {provinceId}</span>
        </div>
    )
}
