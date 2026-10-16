import { motion, useReducedMotion } from "framer-motion";

interface Turn {
  prompt: string;
  status: "scored" | "active" | "queued";
  score?: number;
}

const TURNS: Turn[] = [
  {
    prompt: "Walk me through a time you optimized a slow system.",
    status: "scored",
    score: 8.4,
  },
  {
    prompt: "How would you design a rate limiter for a public API?",
    status: "active",
  },
  {
    prompt: "What's a trade-off you'd flag in that design?",
    status: "queued",
  },
];

function StatusTag({ turn }: { turn: Turn }) {
  if (turn.status === "scored") {
    return (
      <span className="font-mono text-xs text-live">
        {turn.score?.toFixed(1)} / 10
      </span>
    );
  }

  if (turn.status === "active") {
    return (
      <span className="flex items-center gap-1.5 font-mono text-xs text-signal">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
        </span>
        live
      </span>
    );
  }

  return <span className="font-mono text-xs text-white/30">queued</span>;
}

/**
 * The one deliberate, memorable element on the auth pages: a
 * miniature version of the actual artifact this product produces -
 * a scored, turn-by-turn interview session - rather than generic
 * marketing copy or a stock illustration.
 */
export function SessionTurnsSignature() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="w-full max-w-sm space-y-3">
      {TURNS.map((turn, index) => (
        <motion.div
          key={turn.prompt}
          initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.15, duration: 0.5, ease: "easeOut" }}
          className={`rounded-xl border px-4 py-3.5 backdrop-blur-sm ${
            turn.status === "queued"
              ? "border-white/10 bg-white/[0.03]"
              : "border-white/15 bg-white/[0.06]"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <p
              className={`text-sm leading-snug ${
                turn.status === "queued" ? "text-white/40" : "text-white/85"
              }`}
            >
              {turn.prompt}
            </p>
            <StatusTag turn={turn} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
