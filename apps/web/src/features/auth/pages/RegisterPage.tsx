import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { Button } from "../components/Button";
import { Alert } from "../components/Alert";
import { Captcha } from "../components/Captcha";

import { registerSchema, type RegisterFormValues } from "../schemas";
import { register as registerUser } from "../api";
import { getApiErrorMessage } from "../../../lib/apiClient";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);
  /** null = hasn't reported in yet; "" = CAPTCHA isn't configured. */
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null);

    try {
      const result = await registerUser({
        ...values,
        captchaToken: captchaToken ?? undefined,
      });
      navigate(`/verify-email?email=${encodeURIComponent(result.email)}`, {
        replace: true,
        state: { justRegistered: true },
      });
    } catch (error) {
      setFormError(getApiErrorMessage(error));
      // See LoginPage's identical comment - a used/expired token
      // can't be replayed on retry.
      setCaptchaToken(null);
    }
  };

  return (
    <AuthLayout
      eyebrow="Get started"
      title="Create your account"
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-signal">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label="First name"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...field("firstName")}
          />
          <FormField
            label="Last name"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...field("lastName")}
          />
        </div>

        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...field("email")}
        />

        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          error={errors.password?.message}
          {...field("password")}
        />
        <p className="!-mt-2 text-xs text-ink-soft">
          At least 8 characters, with an uppercase letter, lowercase letter,
          number, and symbol.
        </p>

        <Captcha onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />

        <Button type="submit" loading={isSubmitting} disabled={captchaToken === null}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
