"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { generateCaptcha, verifyCaptcha } from "@/lib/captcha";

const signInSchema = z.object({
    identifier: z.string().trim().min(3, "Enter your username, email, or phone number."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    captcha: z.string().trim().min(1, "Captcha is required."),
    rememberMe: z.boolean(),
});

type SignInValues = z.infer<typeof signInSchema>;

export default function SignInPage() {
    const router = useRouter();
    const [captcha, setCaptcha] = useState<{ code: string; image: string } | null>(null);
    const rememberMeId = "rememberMe";

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCaptcha(generateCaptcha());
    }, []);

    const form = useForm<SignInValues>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            identifier: "",
            password: "",
            captcha: "",
            rememberMe: true,
        },
    });

    const onSubmit = async (values: SignInValues) => {
        const normalizedIdentifier = values.identifier.trim();
        const normalizedCaptcha = values.captcha.trim();

        form.clearErrors("captcha");

        if (!captcha || !verifyCaptcha(normalizedCaptcha, captcha.code)) {
            form.setError("captcha", {
                type: "manual",
                message: "Captcha code is incorrect. Please try again.",
            });
            setCaptcha(generateCaptcha());
            form.resetField("captcha", { keepError: true });
            return;
        }

        try {
            const isEmail = normalizedIdentifier.includes("@");
            const isPhone = /^\+?[0-9\s()\-]{7,}$/.test(normalizedIdentifier);

            if (isEmail) {
                await authClient.signIn.email({
                    email: normalizedIdentifier,
                    password: values.password,
                    rememberMe: values.rememberMe,
                });
            } else if (isPhone) {
                await authClient.signIn.phoneNumber({
                    phoneNumber: normalizedIdentifier,
                    password: values.password,
                    rememberMe: values.rememberMe,
                });
            } else {
                await authClient.signIn.username({
                    username: normalizedIdentifier,
                    password: values.password,
                    rememberMe: values.rememberMe,
                });
            }

            router.replace("/dashboard");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Unable to sign in with the provided credentials.";
            form.setError("root", { message });

            setCaptcha(generateCaptcha());
            form.resetField("captcha");
        }
    };

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
            <Card className="w-full max-w-md border-slate-200 bg-white shadow-xl">
                <CardHeader className="space-y-2">
                    <div className="flex items-center justify-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-lg font-bold text-white shadow-sm">
                            JMC
                        </div>
                    </div>
                    <CardTitle className="text-center text-2xl">Sign In</CardTitle>
                </CardHeader>
                <CardContent>
                    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                        <Field data-invalid={Boolean(form.formState.errors.identifier)}>
                            <FieldLabel htmlFor="identifier">Username / Email / Phone Number</FieldLabel>
                            <Input
                                id="identifier"
                                type="text"
                                placeholder="Enter your username or email"
                                autoComplete="username"
                                aria-invalid={Boolean(form.formState.errors.identifier)}
                                {...form.register("identifier")}
                            />
                            <FieldError errors={[form.formState.errors.identifier]} />
                        </Field>

                        <Field data-invalid={Boolean(form.formState.errors.password)}>
                            <FieldLabel htmlFor="password">Password</FieldLabel>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Enter your password"
                                autoComplete="current-password"
                                aria-invalid={Boolean(form.formState.errors.password)}
                                {...form.register("password")}
                            />
                            <FieldError errors={[form.formState.errors.password]} />
                        </Field>

                        <Field
                            data-invalid={Boolean(form.formState.errors.captcha)}
                            className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
                        >
                            <div className="flex items-center justify-between gap-3">
                                <FieldLabel htmlFor="captcha" className="text-slate-700">
                                    Captcha
                                </FieldLabel>
                                <Button
                                    type="button"
                                    onClick={() => setCaptcha(generateCaptcha())}
                                    size="sm"
                                    variant="outline"
                                >
                                    Refresh
                                </Button>
                            </div>

                            <div className="flex items-center justify-center overflow-hidden rounded-lg border border-dashed border-slate-300 bg-white p-2">
                                {captcha ? (
                                    <Image
                                        src={captcha.image}
                                        alt="Captcha challenge"
                                        width={240}
                                        height={80}
                                        unoptimized
                                        className="h-16 w-full rounded-md object-cover"
                                    />
                                ) : (
                                    <div className="flex h-16 w-full items-center justify-center text-sm text-slate-400">
                                        Loading captcha...
                                    </div>
                                )}
                            </div>

                            <Input
                                id="captcha"
                                type="text"
                                placeholder="Type the code shown"
                                autoComplete="off"
                                aria-invalid={Boolean(form.formState.errors.captcha)}
                                maxLength={5}
                                {...form.register("captcha")}
                            />
                            <FieldError errors={[form.formState.errors.captcha]} />
                        </Field>

                        <div className="flex items-center justify-between gap-4">
                            <Controller
                                name="rememberMe"
                                control={form.control}
                                render={({ field }) => (
                                    <Field orientation="horizontal" className="items-center gap-2" data-slot="field">
                                        <Checkbox
                                            id={rememberMeId}
                                            checked={Boolean(field.value)}
                                            onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                                        />
                                        <FieldLabel htmlFor={rememberMeId} className="cursor-pointer text-sm text-slate-700">
                                            Remember me
                                        </FieldLabel>
                                    </Field>
                                )}
                            />
                        </div>

                        {form.formState.errors.root ? (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {form.formState.errors.root.message}
                            </div>
                        ) : null}

                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}
