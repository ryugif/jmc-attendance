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
import { create } from "@/app/dashboard/settings/job-position/actions"
import { Checkbox } from "@/components/ui/checkbox"

// Validation schema
const schema = z.object({
    name: z
        .string()
        .min(1, "Job position name is required")
        .min(3, "Job position name must be at least 3 characters")
        .max(255, "Job position name must not exceed 255 characters"),
    description: z
        .string()
        .max(1000, "Description must not exceed 1000 characters")
        .optional()
        .or(z.literal("")),
    isActive: z.boolean().optional(),
})

type JobPositionFormData = z.infer<typeof schema>

export default function CreateJobPositionPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<JobPositionFormData>({
        resolver: zodResolver(schema),
    })

    const onSubmit = async (data: JobPositionFormData) => {
        setIsLoading(true)
        setError(null)
        try {
            await create({
                name: data.name,
                description: data.description,
            })
            router.push("/dashboard/settings/job-position")
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to create job position"
            setError(errorMessage)
            console.error("Error creating job position:", err)
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
                title="Create New Job Position"
                description="Add a new job position to your organization."
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
                            {/* Job Position Name Field */}
                            <Field>
                                <FieldLabel htmlFor="name">Job Position Name</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Software Engineer"
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
                                        placeholder="Enter a brief description of the job position (optional)"
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
                            {isLoading ? "Saving..." : "Save Job Position"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}