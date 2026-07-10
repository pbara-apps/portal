const ADMIN_SEGMENTS = new Set([
  "executive",
  "office",
  "chapter",
  "news",
  "event",
  "gallery",
  "administrative",
  "messages",
  "profile",
  "audit",
  "settings",
]);

export function isSafeReturnPath(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  if (path.startsWith("/login")) return false;
  return path.startsWith("/admin") || path.startsWith("/member") || path === "/";
}

export function normalizeReturnPath(from: string | null | undefined) {
  if (!from) return "/admin";

  let decoded = from;
  try {
    decoded = decodeURIComponent(from);
  } catch {
    return "/admin";
  }

  if (isSafeReturnPath(decoded)) return decoded;

  const segment = decoded.replace(/^\/+|\/+$/g, "");
  if (segment && ADMIN_SEGMENTS.has(segment)) {
    return `/admin/${segment}`;
  }

  return "/admin";
}

export function buildLoginPath(returnTo?: string | null) {
  const path = normalizeReturnPath(returnTo ?? null);
  if (path === "/admin") return "/login";
  return `/login?from=${encodeURIComponent(path)}`;
}

export function currentReturnPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}
