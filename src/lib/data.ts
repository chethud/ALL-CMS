import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_COOKIE, pickSite, type Site } from "@/lib/site";
import {
  homepageFromContent,
  insightFromContent,
  projectFromContent,
  testimonialFromContent,
  type HomepageContent,
  type InsightContent,
  type ProjectContent,
  type TestimonialContent,
} from "@/lib/content";

export const currentSiteContext = cache(async () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      sites: [] as Site[],
      site: null as Site | null,
      error: "Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local.",
    };
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("sites").select("id, name, domain").order("name");
  if (error) {
    return { sites: [] as Site[], site: null as Site | null, error: error.message };
  }
  const sites = (data ?? []) as Site[];
  const cookieStore = await cookies();
  const site = pickSite(sites, cookieStore.get(SITE_COOKIE)?.value);
  return { sites, site, error: null as string | null };
});

export async function requireEditingSite() {
  const context = await currentSiteContext();
  if (context.error) throw new Error(context.error);
  if (!context.site) redirect("/");
  return context.site;
}

async function rows<T>(table: "projects" | "insights" | "testimonials", siteId: string, map: (content: unknown) => T) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(table)
    .select("id, position, content")
    .eq("site_id", siteId)
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => map(row.content));
}

export function listProjects(siteId: string) {
  return rows<ProjectContent>("projects", siteId, projectFromContent);
}

export function listInsights(siteId: string) {
  return rows<InsightContent>("insights", siteId, insightFromContent);
}

export function listTestimonials(siteId: string) {
  return rows<TestimonialContent>("testimonials", siteId, testimonialFromContent);
}

export async function getProject(siteId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("projects")
    .select("content")
    .eq("site_id", siteId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? projectFromContent(data.content) : null;
}

export async function getInsight(siteId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("insights")
    .select("content")
    .eq("site_id", siteId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? insightFromContent(data.content) : null;
}

export async function getTestimonial(siteId: string, id: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("content")
    .eq("site_id", siteId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? testimonialFromContent(data.content) : null;
}

export async function getHomepage(siteId: string): Promise<HomepageContent> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("site_settings").select("content").eq("site_id", siteId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? homepageFromContent(data.content) : homepageFromContent({});
}

export async function siteCounts(siteId: string) {
  const supabase = createAdminClient();
  const [projects, insights, testimonials, settings] = await Promise.all([
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("site_id", siteId),
    supabase.from("insights").select("id", { count: "exact", head: true }).eq("site_id", siteId),
    supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("site_id", siteId),
    supabase.from("site_settings").select("content").eq("site_id", siteId).maybeSingle(),
  ]);
  const failed = [projects.error, insights.error, testimonials.error, settings.error].find(Boolean);
  if (failed) throw new Error(failed.message);
  return {
    projects: projects.count ?? 0,
    insights: insights.count ?? 0,
    testimonials: testimonials.count ?? 0,
    homepage: settings.data ? homepageFromContent(settings.data.content) : null,
  };
}
