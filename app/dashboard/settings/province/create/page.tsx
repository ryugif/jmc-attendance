"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
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
import { create } from "@/app/dashboard/settings/province/actions"
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

export default function CreateProvincePage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ProvinceFormData>({
        resolver: zodResolver(schema),
    })

    const onSubmit = async (data: ProvinceFormData) => {
        setIsLoading(true)
        setError(null)
        try {
            await create({
                name: data.name,
                description: data.description,
            })
            router.push("/dashboard/settings/province")
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to create province"
            setError(errorMessage)
            console.error("Error creating province:", err)
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
                title="Create New Province"
                description="Add a new province to your organization."
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
                                        aria-invalid={!!errors.name}
                                    />
                                </FieldContent>
                                <FieldError errors={errors.name ? [errors.name] : []} />
                            </Field>

                            {/* Description Field */}
                            <Field>
                                <FieldLabel htmlFor="description">Description</FieldLabel>
                                <FieldContent>
                                    <Textarea
                                        id="description"
                                        placeholder="Enter a brief description of the province (optional)"
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
                                    <Checkbox
                                        id="isActive"
                                        {...register("isActive")}
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
                            {isLoading ? "Saving..." : "Save Province"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}