export function ForgotPasswordTemplate(
  resetLink: string
): string {

  return `
    <div
      style="
        font-family: Arial;
        max-width:600px;
        margin:auto;
      "
    >
      <h2>InterviewOS</h2>

      <p>
        You requested to reset your password.
      </p>

      <p>
        Click the button below.
      </p>

      <a
        href="${resetLink}"
        style="
          background:#2563eb;
          color:white;
          padding:12px 18px;
          text-decoration:none;
          border-radius:8px;
          display:inline-block;
        "
      >
        Reset Password
      </a>

      <p>
        This link expires in 15 minutes.
      </p>

    </div>
  `;
}