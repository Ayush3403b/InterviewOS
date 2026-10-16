import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-surface px-6 text-center">
      <p className="font-mono text-sm text-ink-soft">404</p>
      <h1 className="font-display text-2xl font-semibold text-ink">
        This page doesn't exist.
      </h1>
      <Link to="/" className="text-sm font-medium text-signal">
        Back to InterviewOS
      </Link>
    </div>
  );
}
