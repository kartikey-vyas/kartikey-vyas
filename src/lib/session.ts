import { cookies } from "next/headers";
import crypto from "node:crypto";

// Signed cookie session. Maps group join codes to the memberId for that
// group so a single browser can hold membership in multiple groups.
//
// Payload format: `${base64url(JSON)}.${base64url(hmac_sha256)}`.
// This is NOT authentication — anyone with the join code can create a
// member and act as them. The signature only prevents trivial tampering.

const COOKIE_NAME = "session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export type SessionPayload = {
  memberships: Record<string, string>; // joinCode → memberId
};

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET is not set. Add it to .env.local or your deployment env.",
    );
  }
  return secret;
}

function b64urlEncode(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function b64urlDecode(str: string): Buffer {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  return Buffer.from(
    str.replace(/-/g, "+").replace(/_/g, "/") + pad,
    "base64",
  );
}

function sign(payloadB64: string, secret: string): string {
  const mac = crypto
    .createHmac("sha256", secret)
    .update(payloadB64)
    .digest();
  return b64urlEncode(mac);
}

function verify(payloadB64: string, signature: string, secret: string): boolean {
  const expected = sign(payloadB64, secret);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature),
    );
  } catch {
    return false;
  }
}

function serialise(payload: SessionPayload): string {
  const secret = getSecret();
  const json = JSON.stringify(payload);
  const payloadB64 = b64urlEncode(Buffer.from(json, "utf8"));
  const sig = sign(payloadB64, secret);
  return `${payloadB64}.${sig}`;
}

function deserialise(value: string | undefined): SessionPayload {
  if (!value) return { memberships: {} };
  const [payloadB64, sig] = value.split(".");
  if (!payloadB64 || !sig) return { memberships: {} };
  const secret = getSecret();
  if (!verify(payloadB64, sig, secret)) return { memberships: {} };
  try {
    const parsed = JSON.parse(b64urlDecode(payloadB64).toString("utf8"));
    if (parsed && typeof parsed === "object" && parsed.memberships) {
      return parsed as SessionPayload;
    }
  } catch {
    // fall through
  }
  return { memberships: {} };
}

export async function getSession(): Promise<SessionPayload> {
  const store = await cookies();
  return deserialise(store.get(COOKIE_NAME)?.value);
}

export async function setMembership(
  joinCode: string,
  memberId: string,
): Promise<void> {
  const store = await cookies();
  const current = deserialise(store.get(COOKIE_NAME)?.value);
  current.memberships[joinCode] = memberId;
  store.set(COOKIE_NAME, serialise(current), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function clearMembership(joinCode: string): Promise<void> {
  const store = await cookies();
  const current = deserialise(store.get(COOKIE_NAME)?.value);
  delete current.memberships[joinCode];
  store.set(COOKIE_NAME, serialise(current), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function getMemberIdForGroup(
  joinCode: string,
): Promise<string | null> {
  const session = await getSession();
  return session.memberships[joinCode] ?? null;
}
