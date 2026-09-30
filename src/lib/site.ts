export const SITE_COOKIE = "cms_site_id";

export const SITE_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
};

export const FIRST_SITE = {
  id: "alliance-square",
  name: "Alliance Square",
  domain: "alliance-square.vercel.app",
} as const;

export interface Site {
  id: string;
  name: string;
  domain: string;
}

export function pickSite(sites: Site[], cookieId?: string | null) {
  if (!cookieId) return null;
  return sites.find((site) => site.id === cookieId) ?? null;
}

export function cleanDomain(value: string) {
  return value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
}

export function isSiteId(value: string) {
  return /^[a-z][a-z0-9-]{1,48}$/.test(value);
}

export function isDomain(value: string) {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(value);
}
