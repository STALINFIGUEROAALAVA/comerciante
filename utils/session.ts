import { getCookies, setCookie, deleteCookie } from "$std/http/cookie.ts";

export interface SessionData {
  userId: number;
  username: string;
  role: string;
}

const SESSION_COOKIE_NAME = "session";
const sessions = new Map<string, SessionData>();

function generateSessionId(): string {
  return crypto.randomUUID();
}

export function createSession(data: SessionData): string {
  const sessionId = generateSessionId();
  sessions.set(sessionId, data);
  return sessionId;
}

export function getSession(sessionId: string): SessionData | undefined {
  return sessions.get(sessionId);
}

export function deleteSession(sessionId: string): void {
  sessions.delete(sessionId);
}

export function setSessionCookie(headers: Headers, sessionId: string): void {
  setCookie(headers, {
    name: SESSION_COOKIE_NAME,
    value: sessionId,
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export function getSessionFromRequest(req: Request): SessionData | undefined {
  const cookies = getCookies(req.headers);
  const sessionId = cookies[SESSION_COOKIE_NAME];
  if (!sessionId) return undefined;
  return getSession(sessionId);
}

export function clearSessionCookie(headers: Headers): void {
  deleteCookie(headers, SESSION_COOKIE_NAME, { path: "/" });
}
