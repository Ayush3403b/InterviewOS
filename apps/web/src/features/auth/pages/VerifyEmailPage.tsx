import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/Button";
import { Alert } from "../components/Alert";

import { resendVerification, verifyEmail } from "../api";
import { getApiErrorMessage } from "../../../lib/apiClient";

type Status = "checking" | "success" | "error" | "awaiting-link";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [status, setStatus] = useState<Status>(
    token ? "checking" : "awaiting-link"
  );
  const [message, setMessage] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const attempted = useRef(false);

  useEffect(() => {
    if (!token || attempted.current) {
      return;
    }
    attempted.current = true;

    verifyEmail({ token })
      .then(() => setStatus("success"))
      .catch((error) => {
        setStatus("error");
        setMessage(getApiErrorMessage(error));
      });
  }, [token]);

  const handleResend = async () => {
    if (!email) return;

    try {
      await resendVerification({ email });
      setResent(true);
    } catch (error) {
      setMessage(getApiErrorMessage(error));
    }
  };

  return (
    <AuthLayout
      eyebrow="One more step"
      title={
        status === "success" ? "Email verified" : "Verify your email"
      }
      footer={
        <Link to="/login" className="font-medium text-signal">
          Back to sign in
        </Link>
      }
    >
      <div className="space-y-4">
        {status === "checking" && (
          <p className="text-sm text-ink-soft">Verifying your email...</p>
        )}

        {status === "success" && (
          <Alert variant="success">
            Your email is verified. You can sign in now.
          </Alert>
        )}

        {status === "error" && (
          <>
            <Alert variant="error">
              {message ?? "That verification link is invalid or expired."}
            </Alert>
            {email && (
              <Button onClick={handleResend} disabled={resent}>
                {resent ? "Link sent" : "Send a new link"}
              </Button>
            )}
          </>
        )}

        {status === "awaiting-link" && (
          <>
            <p className="text-sm text-ink-soft">
              {email
                ? `We sent a verification link to ${email}. Open it to activate your account.`
                : "Check your inbox for a verification link."}
            </p>
            {email && (
              <Button onClick={handleResend} disabled={resent}>
                {resent ? "Link sent" : "Resend verification link"}
              </Button>
            )}
          </>
        )}
      </div>
    </AuthLayout>
  );
}
