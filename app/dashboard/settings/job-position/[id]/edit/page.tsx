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
import { getDetail, update } from "@/app/dashboard/settings/job-position/actions"
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

interface JobPositionData {
    id: string
    name: string
    description: string | null
    isActive: boolean
}

export default function UpdateJobPositionPage() {
    const router = useRouter()
    const params = useParams()
    const jobPositionId = params.id as string

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPageLoading, setIsPageLoading] = useState(true)
    const [jobPosition, setJobPosition] = useState<JobPositionData | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        control,
    } = useForm<JobPositionFormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            isActive: false,
        },
    })

    // Fetch job position data on mount
    useEffect(() => {
        const fetchJobPosition = async () => {
            try {
                setIsPageLoading(true)
                const result = await getDetail(jobPositionId)
                if (result.success) {
                    const jobPosition = result.data as JobPositionData
                    setJobPosition(jobPosition)
                    // Pre-fill form with existing data
                    setValue("name", jobPosition.name)
                    setValue("description", jobPosition.description || "")
                    setValue("isActive", jobPosition.isActive)
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load job position"
                setError(errorMessage)
                console.error("Error fetching job position:", err)
            } finally {
                setIsPageLoading(false)
            }
        }

        if (jobPositionId) {
            fetchJobPosition()
        }
    }, [jobPositionId, setValue])

    const onSubmit = async (data: JobPositionFormData) => {
        setIsLoading(true)
        setError(null)
        try {
            await update(jobPositionId, {
                name: data.name,
                description: data.description,
                isActive: data.isActive,
            })
            router.push("/dashboard/settings/job-position")
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to update job position"
            setError(errorMessage)
            console.error("Error updating job position:", err)
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
                    title="Update Job Position"
                    description="Edit job position details."
                />
                <div className="rounded-lg border border-input bg-card p-6 text-center">
                    Loading job position data...
                </div>
            </div>
        )
    }

    if (!jobPosition) {
        return (
            <div className="flex flex-col gap-6">
                <GlobalHeader
                    title="Update Job Position"
                    description="Edit job position details."
                />
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
                    Job position not found. Please go back and select a valid job position.
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <GlobalHeader
                title="Update Job Position"
                description={`Edit details for "${jobPosition.name}".`}
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
                                        placeholder="Enter job position description..."
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
                            {isLoading ? "Updating..." : "Update Job Position"}
                        </Button>
                    </div>
                </form>
            </div>
            <span className="text-sm text-muted-foreground">ID: {jobPositionId}</span>
        </div>
    )
}
