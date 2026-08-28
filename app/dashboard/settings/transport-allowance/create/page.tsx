"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import GlobalHeader from "@/components/global-header";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { InputGroup, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { createTransportAllowanceSetting } from "@/lib/transport-allowance";

const schema = z.object({
    baseFare: z.number({ message: "Base fare is required." }).positive("Base fare must be greater than 0."),
    minDistance: z.number({ message: "Minimum kilometer is required." }).nonnegative("Minimum kilometer must be 0 or greater."),
    maxDistance: z.number({ message: "Maximum kilometer is required." }).nonnegative("Maximum kilometer must be 0 or greater."),
    effectiveFrom: z.string().min(1, "Effective date is required."),
}).refine((data) => data.minDistance <= data.maxDistance, {
    message: "Minimum kilometer must not be greater than maximum kilometer.",
    path: ["maxDistance"],
});

type FormData = z.infer<typeof schema>;

const formatCurrencyInput = (value: number | string) => {
    const digits = String(value ?? "").replace(/\D/g, "");

    if (!digits) {
        return "";
    }

    return new Intl.NumberFormat("id-ID", {
        maximumFractionDigits: 0,
    }).format(Number(digits));
};

export default function CreateTransportAllowanceSettingPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            baseFare: 5000,
            minDistance: 5,
            maxDistance: 25,
            effectiveFrom: new Date().toISOString().slice(0, 10),
        },
    });

    // eslint-disable-next-line react-hooks/incompatible-library
    const baseFareDisplayValue = formatCurrencyInput(watch("baseFare") ?? "");

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await createTransportAllowanceSetting(data);
            router.push("/dashboard/settings/transport-allowance");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save setting.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <GlobalHeader title="Create Transport Allowance Setting" description="Set the fare and distance range for the allowance calculation." />

            <div className="rounded-lg border border-input bg-card p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {error && (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
                    )}

                    <FieldSet>
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="baseFare">Base Fare</FieldLabel>
                                <FieldContent>
                                    <InputGroup>
                                        <InputGroupInput
                                            id="baseFare"
                                            type="text"
                                            inputMode="numeric"
                                            value={baseFareDisplayValue}
                                            {...register("baseFare", {
                                                setValueAs: (value) => {
                                                    const digits = String(value ?? "").replace(/\D/g, "");
                                                    return digits === "" ? NaN : Number(digits);
                                                },
                                                onChange: (event) => {
                                                    const digits = event.target.value.replace(/\D/g, "");
                                                    const numericValue = digits === "" ? 0 : Number(digits);

                                                    setValue("baseFare", numericValue, {
                                                        shouldValidate: true,
                                                        shouldDirty: true,
                                                    });
                                                },
                                            })}
                                            aria-invalid={!!errors.baseFare}
                                        />
                                        <InputGroupText className="text-sm text-zinc-600 px-2">/ km</InputGroupText>
                                    </InputGroup>
                                </FieldContent>
                                <FieldError errors={errors.baseFare ? [errors.baseFare] : []} />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="effectiveFrom">Effective From</FieldLabel>
                                <FieldContent>
                                    <Input id="effectiveFrom" type="date" {...register("effectiveFrom")} aria-invalid={!!errors.effectiveFrom} />
                                </FieldContent>
                                <FieldError errors={errors.effectiveFrom ? [errors.effectiveFrom] : []} />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="minDistance">Minimum Kilometer</FieldLabel>
                                <FieldContent>
                                    <Input id="minDistance" type="number" min="0" step="0.1" {...register("minDistance", { setValueAs: (value) => value === "" ? NaN : Number(value) })} aria-invalid={!!errors.minDistance} />
                                </FieldContent>
                                <FieldError errors={errors.minDistance ? [errors.minDistance] : []} />
                            </Field>

                            <Field>
                                <FieldLabel htmlFor="maxDistance">Maximum Kilometer</FieldLabel>
                                <FieldContent>
                                    <Input id="maxDistance" type="number" min="0" step="0.1" {...register("maxDistance", { setValueAs: (value) => value === "" ? NaN : Number(value) })} aria-invalid={!!errors.maxDistance} />
                                </FieldContent>
                                <FieldError errors={errors.maxDistance ? [errors.maxDistance] : []} />
                            </Field>
                        </FieldGroup>
                    </FieldSet>

                    <div className="flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Setting"}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
