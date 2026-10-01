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

export type StudioSection = "layouts" | "insights" | "testimonials" | "homepage";

const ALL_SECTIONS: StudioSection[] = ["layouts", "insights", "testimonials", "homepage"];

export function siteSections(siteId: string): StudioSection[] {
  if (siteId === "bs-prashanth") return ["insights"];
  // Layouts = Window Seat newsletters (brochure URL + cover image); Insights = blog.
  if (siteId === "safe-wheels-group") return ["layouts", "insights"];
  if (siteId === "open-jeep-tours") return ["testimonials"];
  return ALL_SECTIONS;
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

const SITE_LOGOS: Record<string, { src: string; round?: boolean; bg?: string }> = {
  "alliance-square": { src: "/logos/alliance-square.png" },
  "bs-prashanth": { src: "/logos/bs-prashanth.png", round: true },
  "safe-wheels-group": { src: "/logos/safe-wheels-group.png" },
  "open-jeep-tours": { src: "/logos/open-jeep-tours.png", bg: "bg-[#ED1D24]" },
};

export function siteLogo(siteId: string) {
  return SITE_LOGOS[siteId] ?? null;
}
