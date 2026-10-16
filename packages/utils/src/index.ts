/**
 * Formats a duration in seconds to "MM:SS" string.
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Normalizes text for keyword matching.
 */
export function normalizeKeyword(text: string): string {
  return text.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Truncates text with an ellipsis if it exceeds maxLength.
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}

/**
 * Generates a clean slug from a string.
 */
export function slugifyText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
