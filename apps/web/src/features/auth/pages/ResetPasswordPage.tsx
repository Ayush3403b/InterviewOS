import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { Button } from "../components/Button";
import { Alert } from "../components/Alert";

import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "../schemas";
import { resetPassword } from "../api";
import { getApiErrorMessage } from "../../../lib/apiClient";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [formError, setFormError] = useState<string | null>(null);

  const {
    register: field,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      setFormError("This reset link is missing its token. Request a new one.");
      return;
    }

    setFormError(null);

    try {
      await resetPassword({ token, ...values });
      navigate("/login", { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error));
    }
  };

  return (
    <AuthLayout
      eyebrow="Reset password"
      title="Choose a new password"
      footer={
        <Link to="/login" className="font-medium text-signal">
          Back to sign in
        </Link>
      }
    >
      {!token ? (
        <Alert variant="error">
          This link is missing its token.{" "}
          <Link to="/forgot-password" className="font-medium underline">
            Request a new one
          </Link>
          .
        </Alert>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          {formError && <Alert variant="error">{formError}</Alert>}

          <FormField
            label="New password"
            type="password"
            autoComplete="new-password"
            error={errors.password?.message}
            {...field("password")}
          />

          <FormField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...field("confirmPassword")}
          />

          <Button type="submit" loading={isSubmitting}>
            Reset password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
