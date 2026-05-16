export const SESSION_COOKIE = "internori_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 días

function getSecret(): string {
  return process.env.AUTH_SECRET ?? "";
}

function bytesToHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return out === 0;
}

async function hmacHex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return bytesToHex(signature);
}

export function authConfigured(): boolean {
  return Boolean(
    process.env.AUTH_USERNAME &&
      process.env.AUTH_PASSWORD &&
      process.env.AUTH_SECRET,
  );
}

export function validateCredentials(username: string, password: string): boolean {
  if (!authConfigured()) return false;

  return (
    username === process.env.AUTH_USERNAME && password === process.env.AUTH_PASSWORD
  );
}

export async function createSessionToken(username: string): Promise<string> {
  const sig = await hmacHex(username, getSecret());
  return `${encodeURIComponent(username)}.${sig}`;
}

export async function verifySessionCookie(value: string | undefined): Promise<string | null> {
  if (!value || !getSecret()) return null;

  const dot = value.indexOf(".");
  if (dot === -1) return null;

  const encodedUser = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const username = decodeURIComponent(encodedUser);

  const expected = await hmacHex(username, getSecret());
  if (!timingSafeEqualHex(sig, expected)) return null;
  if (username !== process.env.AUTH_USERNAME) return null;

  return username;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}
