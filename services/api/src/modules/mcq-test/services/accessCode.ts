import { randomInt } from "crypto";

/** No 0/O or 1/I - codes get read aloud and typed by hand. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const ACCESS_CODE_LENGTH = 8;

export function generateAccessCode(): string {
  let code = "";

  for (let i = 0; i < ACCESS_CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }

  return code;
}

/** Forgiving about case, spaces and dashes in what a candidate types. */
export function normalizeAccessCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s-]/g, "");
}
