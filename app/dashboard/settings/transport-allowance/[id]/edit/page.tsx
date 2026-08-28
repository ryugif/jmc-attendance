"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import GlobalHeader from "@/components/global-header";
import { Button } from "@/components/ui/button";
import { Field, FieldContent, FieldError, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { InputGroup, InputGroupInput, InputGroupText } from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { getTransportAllowanceSettingDetail, updateTransportAllowanceSetting } from "../../actions";

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

export default function EditTransportAllowanceSettingPage() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const { register, handleSubmit, watch, formState: { errors }, setValue } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    // eslint-disable-next-line react-hooks/incompatible-library
    const baseFareDisplayValue = formatCurrencyInput(watch("baseFare") ?? "");

    useEffect(() => {
        const load = async () => {
            try {
                const record = await getTransportAllowanceSettingDetail(id);
                setValue("baseFare", Number(record.baseFare));
                setValue("minDistance", Number(record.minDistance ?? 0));
                setValue("maxDistance", Number(record.maxDistance ?? 0));
                setValue("effectiveFrom", new Date(record.effectiveFrom).toISOString().slice(0, 10));
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load setting.");
            } finally {
                setPageLoading(false);
            }
        };

        if (id) {
            void load();
        }
    }, [id, setValue]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await updateTransportAllowanceSetting(id, data);
            router.push("/dashboard/settings/transport-allowance");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to update setting.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (pageLoading) {
        return <div className="rounded-lg border border-input bg-card p-6 text-sm text-zinc-600">Loading setting...</div>;
    }

    return (
        <div className="space-y-6">
            <GlobalHeader title="Edit Transport Allowance Setting" description="Adjust the rate or distance range for the selected period." />

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
                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : "Save Changes"}</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
