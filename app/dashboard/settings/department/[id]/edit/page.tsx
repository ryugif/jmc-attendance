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
import { getDetail, update } from "@/app/dashboard/settings/department/actions"
import { Checkbox } from "@/components/ui/checkbox"

// Validation schema
const departmentSchema = z.object({
    name: z
        .string()
        .min(1, "Department name is required")
        .min(3, "Department name must be at least 3 characters")
        .max(255, "Department name must not exceed 255 characters"),
    description: z
        .string()
        .max(1000, "Description must not exceed 1000 characters")
        .optional()
        .or(z.literal("")),
    isActive: z.boolean().optional(),
})

type DepartmentFormData = z.infer<typeof departmentSchema>

interface DepartmentData {
    id: string
    name: string
    description: string | null
    isActive: boolean
}

export default function UpdateDepartmentPage() {
    const router = useRouter()
    const params = useParams()
    const departmentId = params.id as string

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isPageLoading, setIsPageLoading] = useState(true)
    const [department, setDepartment] = useState<DepartmentData | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        control,
    } = useForm<DepartmentFormData>({
        resolver: zodResolver(departmentSchema),
        defaultValues: {
            isActive: false,
        },
    })

    // Fetch department data on mount
    useEffect(() => {
        const fetchDepartment = async () => {
            try {
                setIsPageLoading(true)
                const result = await getDetail(departmentId)
                if (result.success) {
                    const dept = result.data as DepartmentData
                    setDepartment(dept)
                    // Pre-fill form with existing data
                    setValue("name", dept.name)
                    setValue("description", dept.description || "")
                    setValue("isActive", dept.isActive)
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to load department"
                setError(errorMessage)
                console.error("Error fetching department:", err)
            } finally {
                setIsPageLoading(false)
            }
        }

        if (departmentId) {
            fetchDepartment()
        }
    }, [departmentId, setValue])

    const onSubmit = async (data: DepartmentFormData) => {
        setIsLoading(true)
        setError(null)
        try {
            await update(departmentId, {
                name: data.name,
                description: data.description,
                isActive: data.isActive,
            })
            router.push("/dashboard/settings/department")
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to update department"
            setError(errorMessage)
            console.error("Error updating department:", err)
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
                    title="Update Department"
                    description="Edit department details."
                />
                <div className="rounded-lg border border-input bg-card p-6 text-center">
                    Loading department data...
                </div>
            </div>
        )
    }

    if (!department) {
        return (
            <div className="flex flex-col gap-6">
                <GlobalHeader
                    title="Update Department"
                    description="Edit department details."
                />
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
                    Department not found. Please go back and select a valid department.
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <GlobalHeader
                title="Update Department"
                description={`Edit details for "${department.name}".`}
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
                            {/* Department Name Field */}
                            <Field>
                                <FieldLabel htmlFor="name">Department Name</FieldLabel>
                                <FieldContent>
                                    <Input
                                        id="name"
                                        placeholder="e.g., Human Resources"
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
                                        placeholder="Enter department description..."
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
                            {isLoading ? "Updating..." : "Update Department"}
                        </Button>
                    </div>
                </form>
            </div>
            <span className="text-sm text-muted-foreground">ID: {departmentId}</span>
        </div>
    )
}
