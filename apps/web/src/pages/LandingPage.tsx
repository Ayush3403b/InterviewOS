import { Link } from "react-router-dom";

/**
 * Placeholder root page. The real marketing/landing experience is
 * its own phase - this just gets people into the auth flow.
 */
export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface px-6 text-center">
      <p className="font-display text-lg font-semibold tracking-tight text-ink">
        InterviewOS
      </p>
      <h1 className="font-display max-w-lg text-3xl font-semibold text-ink">
        Every interview, scored the same careful way.
      </h1>
      <div className="flex gap-3">
        <Link
          to="/login"
          className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-ink"
        >
          Sign in
        </Link>
        <Link
          to="/register"
          className="rounded-lg bg-signal px-4 py-2 text-sm font-medium text-white"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
