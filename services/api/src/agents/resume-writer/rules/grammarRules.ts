import { GrammarIssue } from "../IResumeWriterAgent";

/**
 * ================================================================
 * Rule-based grammar/style checks
 * ================================================================
 *
 * No AI call - regex/heuristic checks for well-known resume-writing
 * issues. These are genuinely useful on their own (this is the same
 * advice any resume-writing guide gives), not a placeholder for the
 * real thing. What they can't do: understand context, judge whether
 * a passive construction is actually the clearer choice here, or
 * suggest a *specific* stronger verb - that's what the LLM path is
 * for. False positives/negatives are expected; this trades precision
 * for being free and instant.
 */

const WEAK_OPENERS = [
  "responsible for",
  "worked on",
  "helped with",
  "assisted in",
  "assisted with",
  "involved in",
  "duties included",
  "tasked with",
];

const PASSIVE_VOICE_PATTERN = /\b(was|were|is|are|been|being)\s+\w+ed\b/gi;
const PERSONAL_PRONOUN_PATTERN = /\b(I|I've|I'm|my|My|me)\b/g;
const HAS_DIGIT_OR_PERCENT = /\d|%/;
const MAX_WORDS_PER_LINE = 35;

function splitIntoLines(text: string): string[] {
  return text
    .split(/\r?\n|(?<=[.!?])\s+(?=[A-Z])/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function checkPassiveVoice(line: string): GrammarIssue | null {
  const match = line.match(PASSIVE_VOICE_PATTERN);
  if (!match) return null;

  return {
    type: "passive_voice",
    excerpt: match[0],
    message: `"${match[0]}" reads as passive voice - consider leading with the action instead.`,
    suggestion: "Rephrase starting with a strong action verb (e.g. 'Led', 'Built', 'Reduced').",
  };
}

function checkWeakOpener(line: string): GrammarIssue | null {
  const lower = line.toLowerCase();
  const opener = WEAK_OPENERS.find((phrase) => lower.startsWith(phrase));

  if (!opener) return null;

  return {
    type: "weak_opener",
    excerpt: line.slice(0, opener.length),
    message: `Starting with "${opener}" is a common weak opener - it describes a duty, not an accomplishment.`,
    suggestion: "Lead with what you actually did and its result instead.",
  };
}

function checkQuantification(line: string): GrammarIssue | null {
  const wordCount = line.split(/\s+/).filter(Boolean).length;

  if (wordCount < 6 || HAS_DIGIT_OR_PERCENT.test(line)) {
    return null;
  }

  return {
    type: "no_quantification",
    message: "This line has no numbers - quantified impact (scale, %, time saved) is usually more convincing.",
    suggestion: "Add a number if one is available (team size, % improvement, users affected, etc.).",
  };
}

function checkPersonalPronouns(line: string): GrammarIssue | null {
  const match = line.match(PERSONAL_PRONOUN_PATTERN);
  if (!match) return null;

  return {
    type: "personal_pronoun",
    excerpt: match[0],
    message: `"${match[0]}" - resume bullets conventionally drop the subject pronoun.`,
    suggestion: `Remove "${match[0]}" and start directly with the verb.`,
  };
}

function checkSentenceLength(line: string): GrammarIssue | null {
  const wordCount = line.split(/\s+/).filter(Boolean).length;

  if (wordCount <= MAX_WORDS_PER_LINE) return null;

  return {
    type: "sentence_too_long",
    message: `This line runs ${wordCount} words - consider splitting it into two bullets.`,
  };
}

function checkRepeatedOpeners(lines: string[]): GrammarIssue[] {
  const issues: GrammarIssue[] = [];

  for (let i = 1; i < lines.length; i++) {
    const prevFirstWord = lines[i - 1].split(/\s+/)[0]?.toLowerCase();
    const currFirstWord = lines[i].split(/\s+/)[0]?.toLowerCase();

    if (prevFirstWord && prevFirstWord === currFirstWord && prevFirstWord.length >= 3) {
      issues.push({
        type: "repeated_word",
        excerpt: lines[i].split(/\s+/)[0],
        message: `Consecutive lines both start with "${lines[i].split(/\s+/)[0]}" - vary your verbs for readability.`,
      });
    }
  }

  return issues;
}

/** Runs every check against each line/sentence of the given text. */
export function runGrammarRules(text: string): GrammarIssue[] {
  const lines = splitIntoLines(text);
  const issues: GrammarIssue[] = [];

  for (const line of lines) {
    const lineIssues = [
      checkPassiveVoice(line),
      checkWeakOpener(line),
      checkQuantification(line),
      checkPersonalPronouns(line),
      checkSentenceLength(line),
    ].filter((issue): issue is GrammarIssue => issue !== null);

    issues.push(...lineIssues);
  }

  issues.push(...checkRepeatedOpeners(lines));

  return issues;
}

const POINTS_PER_ISSUE = 8;

export function scoreFromIssues(issues: GrammarIssue[]): number {
  return Math.max(0, 100 - issues.length * POINTS_PER_ISSUE);
}
