import {
  APPROVALS,
  FILTERS,
  MAP_STATUSES,
  type ApprovalType,
  type HomepageContent,
  type InsightContent,
  type MapStatus,
  type ProjectContent,
  type ProjectFilter,
  type TestimonialContent,
} from "@/lib/types";
import { parseYouTubeId } from "@/lib/youtube";

export type { HomepageContent, InsightContent, ProjectContent, TestimonialContent };

export type ParseResult<T> = { content: T; error: null } | { content: null; error: string };

function str(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function num(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

function flag(value: unknown, fallback: boolean) {
  return typeof value === "boolean" ? value : fallback;
}

function strList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function slugInput(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function asRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function blankProject(): ProjectContent {
  return {
    id: "",
    slug: "",
    name: "",
    tagline: "",
    description: "",
    location: { area: "", city: "", coordinates: { lat: 0, lng: 0 } },
    pricePerSqft: 0,
    priceLabel: "",
    plotSizes: [],
    approvals: [],
    filters: [],
    highlights: [],
    amenities: [],
    facilities: [],
    nearbyLandmarks: [],
    featured: false,
    spotlight: false,
    heroImage: "",
    gallery: [],
    listingDescription: "",
    brochureUrl: "",
    youtubeShortId: "",
    youtubeGalleryIds: [],
    mapStatus: "running",
    showOnLayouts: true,
  };
}

export function blankInsight(): InsightContent {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return {
    id: "",
    slug: "",
    title: "",
    excerpt: "",
    category: "",
    date,
    image: "",
    body: [],
    source: "",
  };
}

export function blankTestimonial(): TestimonialContent {
  return {
    id: "",
    name: "",
    location: "",
    quote: "",
    image: "",
    designation: "",
    verified: true,
    service: "",
  };
}

export function blankHomepage(): HomepageContent {
  return {
    heroVideoId: "",
    stats: { years: 0, layouts: 0, customers: 0, customerFocused: "" },
  };
}

export function projectFromContent(raw: unknown): ProjectContent {
  const row = asRecord(raw);
  const location = asRecord(row.location);
  const coordinates = asRecord(location.coordinates);
  const legacyGallery = str(row.youtubeGalleryId);
  const galleryIds = strList(row.youtubeGalleryIds)
    .map((value) => parseYouTubeId(value))
    .filter(Boolean);
  if (legacyGallery) {
    const id = parseYouTubeId(legacyGallery);
    if (id && !galleryIds.includes(id)) galleryIds.push(id);
  }
  const mapStatus = str(row.mapStatus);
  return {
    id: str(row.id),
    slug: str(row.slug),
    name: str(row.name),
    tagline: str(row.tagline),
    description: str(row.description),
    location: {
      area: str(location.area),
      city: str(location.city),
      coordinates: { lat: num(coordinates.lat), lng: num(coordinates.lng) },
    },
    pricePerSqft: num(row.pricePerSqft),
    priceLabel: str(row.priceLabel),
    plotSizes: strList(row.plotSizes),
    approvals: strList(row.approvals).filter((item): item is ApprovalType =>
      (APPROVALS as readonly string[]).includes(item),
    ),
    filters: strList(row.filters).filter((item): item is ProjectFilter =>
      (FILTERS as readonly string[]).includes(item),
    ),
    highlights: strList(row.highlights),
    amenities: strList(row.amenities),
    facilities: strList(row.facilities),
    nearbyLandmarks: strList(row.nearbyLandmarks),
    featured: flag(row.featured, false),
    spotlight: flag(row.spotlight, false),
    heroImage: str(row.heroImage),
    gallery: strList(row.gallery),
    listingDescription: str(row.listingDescription),
    brochureUrl: str(row.brochureUrl),
    youtubeShortId: parseYouTubeId(str(row.youtubeShortId)),
    youtubeGalleryIds: galleryIds,
    mapStatus: (MAP_STATUSES as readonly string[]).includes(mapStatus) ? (mapStatus as MapStatus) : "running",
    showOnLayouts: flag(row.showOnLayouts, true),
  };
}

export function insightFromContent(raw: unknown): InsightContent {
  const row = asRecord(raw);
  return {
    id: str(row.id),
    slug: str(row.slug),
    title: str(row.title),
    excerpt: str(row.excerpt),
    category: str(row.category),
    date: str(row.date),
    image: str(row.image),
    body: strList(row.body).length ? strList(row.body) : strList(row.paragraphs),
    source: str(row.source) || str(row.href),
  };
}

export function testimonialFromContent(raw: unknown): TestimonialContent {
  const row = asRecord(raw);
  return {
    id: str(row.id),
    name: str(row.name),
    location: str(row.location),
    quote: str(row.quote),
    image: str(row.image),
    designation: str(row.designation),
    verified: flag(row.verified, false),
    service: str(row.service),
  };
}

export function homepageFromContent(raw: unknown): HomepageContent {
  const row = asRecord(raw);
  const stats = asRecord(row.stats);
  return {
    heroVideoId: parseYouTubeId(str(row.heroVideoId)) || str(row.heroVideoId),
    stats: {
      years: num(stats.years),
      layouts: num(stats.layouts),
      customers: num(stats.customers),
      customerFocused: str(stats.customerFocused),
    },
  };
}

function galleryIds(values: string[]) {
  const ids: string[] = [];
  for (const value of values) {
    const id = parseYouTubeId(value);
    if (!id) return { ids, error: "A gallery video is not a valid YouTube link." };
    if (ids.includes(id)) return { ids, error: "A gallery video is listed twice." };
    ids.push(id);
  }
  return { ids, error: null as string | null };
}

export function normalizeProject(draft: ProjectContent, options?: { existingId?: string }): ParseResult<ProjectContent> {
  const name = draft.name.trim();
  const slug = slugify(draft.slug || name);
  if (!name) return { content: null, error: "Enter the layout name." };
  if (!slug) return { content: null, error: "Enter a slug using letters or numbers." };

  const shortRaw = draft.youtubeShortId.trim();
  const youtubeShortId = shortRaw ? parseYouTubeId(shortRaw) : "";
  if (shortRaw && !youtubeShortId) {
    return {
      content: null,
      error: "Starting video needs a YouTube watch link, youtu.be link, Shorts link, or an 11-character id.",
    };
  }

  const gallery = galleryIds(draft.youtubeGalleryIds);
  if (gallery.error) return { content: null, error: gallery.error };

  const id = options?.existingId || slugify(draft.id) || slug;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    return { content: null, error: "The layout id can only use lowercase letters, numbers, and hyphens." };
  }

  const mapStatus = draft.mapStatus === "completed" ? "completed" : "running";
  return {
    error: null,
    content: {
      ...projectFromContent(draft),
      id,
      slug,
      name,
      youtubeShortId,
      youtubeGalleryIds: gallery.ids,
      mapStatus,
      showOnLayouts: Boolean(draft.showOnLayouts),
      featured: Boolean(draft.featured),
      spotlight: Boolean(draft.spotlight),
    },
  };
}

export function normalizeInsight(draft: InsightContent, options?: { existingId?: string }): ParseResult<InsightContent> {
  const title = draft.title.trim();
  const slug = slugify(draft.slug || title);
  if (!title) return { content: null, error: "Enter the insight title." };
  if (!slug) return { content: null, error: "Enter a slug using letters or numbers." };
  const id = options?.existingId || slug;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date)) {
    return { content: null, error: "Choose a date." };
  }
  return {
    error: null,
    content: {
      ...insightFromContent(draft),
      id,
      slug,
      title,
      date: draft.date,
    },
  };
}

export function normalizeTestimonial(
  draft: TestimonialContent,
  options?: { existingId?: string },
): ParseResult<TestimonialContent> {
  const name = draft.name.trim();
  if (!name) return { content: null, error: "Enter the customer name." };
  if (!draft.quote.trim()) return { content: null, error: "Enter the quote." };
  const id = options?.existingId || slugify(name);
  if (!id) return { content: null, error: "Enter a name that can be saved as an id." };
  return {
    error: null,
    content: {
      ...testimonialFromContent(draft),
      id,
      name,
      quote: draft.quote.trim(),
    },
  };
}

export function normalizeHomepage(draft: HomepageContent): ParseResult<HomepageContent> {
  const raw = draft.heroVideoId.trim();
  const heroVideoId = raw ? parseYouTubeId(raw) : "";
  if (raw && !heroVideoId) {
    return {
      content: null,
      error: "Hero video needs a YouTube watch link, youtu.be link, Shorts link, or an 11-character id.",
    };
  }
  const stats = draft.stats;
  if ([stats.years, stats.layouts, stats.customers].some((value) => !Number.isFinite(value) || value < 0)) {
    return { content: null, error: "Stats need zero or a positive number." };
  }
  return {
    error: null,
    content: {
      heroVideoId,
      stats: {
        years: Math.round(stats.years),
        layouts: Math.round(stats.layouts),
        customers: Math.round(stats.customers),
        customerFocused: stats.customerFocused.trim(),
      },
    },
  };
}
