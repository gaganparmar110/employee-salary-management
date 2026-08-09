// Plain document.cookie helpers — browser-only (guarded so importing this
// module server-side, e.g. during SSR, doesn't throw). middleware.ts does
// NOT use these; it runs in the Edge runtime, which has no `document`, and
// reads cookies via NextRequest's own cookie API instead.

function secureAttribute(): string {
  return typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${encodeURIComponent(name)}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function setCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secureAttribute()}`;
}

export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax${secureAttribute()}`;
}
