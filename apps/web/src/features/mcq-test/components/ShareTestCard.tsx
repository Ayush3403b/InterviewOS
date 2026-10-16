import { useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

import { takeTestUrl } from "../labels";

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-panel px-3 py-1.5 text-xs font-semibold text-ink hover:border-signal/50"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-live" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : label}
    </button>
  );
}

interface ShareTestCardProps {
  accessCode: string;
  acceptingAttempts: boolean;
}

/** The code and link candidates use to take a published test. */
export function ShareTestCard({ accessCode, acceptingAttempts }: ShareTestCardProps) {
  const url = takeTestUrl(accessCode);

  return (
    <section className="rounded-2xl border border-signal/30 bg-signal/5 p-5">
      <div className="flex items-center gap-2">
        <Link2 className="h-4 w-4 text-signal" />
        <h2 className="font-display text-base font-semibold text-ink">Share with candidates</h2>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        {acceptingAttempts
          ? "Anyone signed in with this link or code can take the test once."
          : "This test is closed - the link shows candidates that it isn't accepting attempts."}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="rounded-lg border border-line bg-panel px-3 py-1.5 font-mono text-lg font-bold tracking-[0.2em] text-ink">
          {accessCode}
        </span>
        <CopyButton value={accessCode} label="Copy code" />
        <CopyButton value={url} label="Copy link" />
      </div>
      <p className="mt-2 truncate font-mono text-xs text-ink-soft">{url}</p>
    </section>
  );
}
