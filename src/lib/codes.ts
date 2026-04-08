import { customAlphabet } from "nanoid";

// 6-char uppercase alphanumeric, excluding ambiguous chars (0/O, 1/I/L).
const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const generate = customAlphabet(alphabet, 6);

export function generateJoinCode(): string {
  return generate();
}
