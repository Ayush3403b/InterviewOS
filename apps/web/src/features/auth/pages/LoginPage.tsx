import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { Button } from "../components/Button";
import { Alert } from "../components/Alert";
import { Captcha } from "../components/Captcha";

import { loginSchema, type LoginFormValues } from "../schemas";
import { login } from "../api";
import { useAuthStore } from "../store";
import { getApiErrorMessage } from "../../../lib/apiClient";
import { homePathForRole } from "../../../routes/homePathForRole";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setSession = useAuthStore((state) => state.setSession);

  const [formError, setFormError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState<string | null>(
    null
  );
  /** null = hasn't reported in yet (still loading/waiting on the
   *  widget); "" = CAPTCHA isn't configured, nothing to wait for. */
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  const {
    register: field,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  /* --- DEV DEMO QUICK LOGIN (REMOVABLE) --- */
  const handleQuickDemo = (email: string) => {
    setValue("email", email, { shouldValidate: true });
    setValue("password", "DemoPassword123!", { shouldValidate: true });
    setFormError(null);
  };
  /* ---------------------------------------- */

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? null;

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);
    setNeedsVerification(null);

    try {
      const result = await login({
        ...values,
        captchaToken: captchaToken ?? undefined,
      });
      setSession(result.user, result.accessToken, result.refreshToken);
      navigate(redirectTo ?? homePathForRole(result.user.role), {
        replace: true,
      });
    } catch (error) {
      const message = getApiErrorMessage(error);

      if (message.toLowerCase().includes("verify")) {
        setNeedsVerification(values.email);
      } else {
        setFormError(message);
      }
      // A used/expired CAPTCHA token can't be replayed - clear it so
      // the widget's next completion (or the no-op path) provides a
      // fresh one before the next submit attempt.
      setCaptchaToken(null);
    }
  };

  return (
    <AuthLayout
      eyebrow="Welcome back"
      title="Sign in to InterviewOS"
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-signal">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}

        {needsVerification && (
          <Alert variant="error">
            Verify {needsVerification} before signing in.{" "}
            <Link
              to={`/verify-email?email=${encodeURIComponent(needsVerification)}`}
              className="font-medium underline"
            >
              Resend the link
            </Link>
          </Alert>
        )}

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
          autoComplete="current-password"
          error={errors.password?.message}
          {...field("password")}
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-signal"
          >
            Forgot password?
          </Link>
        </div>

        <Captcha onVerify={setCaptchaToken} onExpire={() => setCaptchaToken(null)} />

        <Button type="submit" loading={isSubmitting} disabled={captchaToken === null}>
          Sign in
        </Button>

        {/* --- DEV DEMO QUICK LOGIN (REMOVABLE) --- */}
        <div className="mt-6 rounded-lg border border-slate-700/60 bg-slate-800/40 p-3 text-xs text-slate-300">
          <div className="mb-2 flex items-center justify-between font-semibold text-slate-200">
            <span>🧪 Developer Quick Demo Accounts</span>
            <span className="text-[10px] text-slate-400 font-normal">Pass: DemoPassword123!</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("demo.student@interviewos.local")}
              className="rounded bg-slate-700/80 px-2 py-1.5 text-center text-slate-200 hover:bg-slate-600 transition"
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("demo.recruiter@interviewos.local")}
              className="rounded bg-slate-700/80 px-2 py-1.5 text-center text-slate-200 hover:bg-slate-600 transition"
            >
              💼 Recruiter
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo("demo.admin@interviewos.local")}
              className="rounded bg-slate-700/80 px-2 py-1.5 text-center text-slate-200 hover:bg-slate-600 transition"
            >
              👑 Admin
            </button>
          </div>
        </div>
        {/* ---------------------------------------- */}
      </form>
    </AuthLayout>
  );
}
