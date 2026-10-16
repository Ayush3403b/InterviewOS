import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { SessionTurnsSignature } from "./SessionTurnsSignature";

interface AuthLayoutProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-ink px-12 py-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(600px circle at 20% 15%, rgba(47,111,237,0.35), transparent 60%)",
          }}
        />

        <Link
          to="/"
          className="font-display relative text-lg font-semibold tracking-tight text-white"
        >
          InterviewOS
        </Link>

        <div className="relative flex flex-1 flex-col justify-center gap-8 py-16">
          <h2 className="font-display max-w-sm text-[2rem] leading-[1.15] font-semibold text-white">
            Every interview, scored the same careful way.
          </h2>
          <SessionTurnsSignature />
        </div>

        <p className="relative text-sm text-white/40">
          Structured interviews. Consistent evaluation. No guesswork.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link
            to="/"
            className="font-display mb-10 block text-lg font-semibold tracking-tight text-ink lg:hidden"
          >
            InterviewOS
          </Link>

          <p className="text-sm font-medium tracking-wide text-signal uppercase">
            {eyebrow}
          </p>
          <h1 className="font-display mt-2 text-2xl font-semibold text-ink">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-sm text-ink-soft">{subtitle}</p>
          )}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-sm text-ink-soft">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
