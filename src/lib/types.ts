export const APPROVALS = ["MUDA", "MDA", "DTCP", "RERA"] as const;
export const FILTERS = ["premium", "muda", "dtcp", "ready", "investment"] as const;
export const MAP_STATUSES = ["running", "completed"] as const;

export type ApprovalType = (typeof APPROVALS)[number];
export type ProjectFilter = (typeof FILTERS)[number];
export type MapStatus = (typeof MAP_STATUSES)[number];

export interface ProjectContent {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  location: {
    area: string;
    city: string;
    coordinates: { lat: number; lng: number };
  };
  pricePerSqft: number;
  priceLabel: string;
  plotSizes: string[];
  approvals: ApprovalType[];
  filters: ProjectFilter[];
  highlights: string[];
  amenities: string[];
  facilities: string[];
  nearbyLandmarks: string[];
  featured: boolean;
  spotlight: boolean;
  heroImage: string;
  gallery: string[];
  listingDescription: string;
  brochureUrl: string;
  youtubeShortId: string;
  youtubeGalleryIds: string[];
  mapStatus: MapStatus;
  showOnLayouts: boolean;
}

export interface InsightContent {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
  body: string[];
}

export interface TestimonialContent {
  id: string;
  name: string;
  location: string;
  quote: string;
  image: string;
  designation: string;
  verified: boolean;
  service: string;
}

export interface HomepageContent {
  heroVideoId: string;
  stats: {
    years: number;
    layouts: number;
    customers: number;
    customerFocused: string;
  };
}

export const FILTER_LABELS: Record<ProjectFilter, string> = {
  premium: "Premium",
  muda: "MUDA",
  dtcp: "DTCP",
  ready: "Ready",
  investment: "Investment",
};
