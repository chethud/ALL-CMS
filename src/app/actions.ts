"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createEditorToken, EDITOR_COOKIE, editorTokenValid } from "@/lib/editor-session";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  blankHomepage,
  normalizeHomepage,
  normalizeInsight,
  normalizeProject,
  normalizeTestimonial,
  type HomepageContent,
  type InsightContent,
  type ProjectContent,
  type TestimonialContent,
} from "@/lib/content";
import { storagePathFromPublicUrl } from "@/lib/media";
import { SITE_COOKIE, SITE_COOKIE_OPTIONS, cleanDomain, isDomain, isSiteId, siteSections, type StudioSection } from "@/lib/site";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 14,
};

async function editorDb() {
  const cookieStore = await cookies();
  const signedIn = await editorTokenValid(cookieStore.get(EDITOR_COOKIE)?.value);
  if (!signedIn) return { supabase: null, error: "Sign in required." as const };
  try {
    return { supabase: createAdminClient(), error: null };
  } catch (error) {
    return { supabase: null, error: error instanceof Error ? error.message : "Database is not configured." };
  }
}

function clearSiteCookie(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  cookieStore.set(SITE_COOKIE, "", { ...SITE_COOKIE_OPTIONS, maxAge: 0 });
  cookieStore.delete({ name: SITE_COOKIE, path: "/" });
}

async function selectedSiteId() {
  const cookieStore = await cookies();
  return cookieStore.get(SITE_COOKIE)?.value ?? "";
}

async function nextPosition(
  supabase: SupabaseClient,
  table: "projects" | "insights" | "testimonials",
  siteId: string,
) {
  const { data } = await supabase
    .from(table)
    .select("position")
    .eq("site_id", siteId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.position as number | undefined) ?? -1) + 1;
}

function passwordMatches(input: string) {
  const expected = process.env.CMS_ACCESS_PASSWORD ?? "";
  if (!expected || !input) return false;
  const actualHash = createHash("sha256").update(input).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export async function signIn(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const password = String(formData.get("password") || "");
  if (!process.env.CMS_ACCESS_PASSWORD) {
    return { ok: false, error: "Set CMS_ACCESS_PASSWORD in .env.local, then restart the app." };
  }
  if (!passwordMatches(password)) return { ok: false, error: "That password does not open the studio." };
  const cookieStore = await cookies();
  cookieStore.set(EDITOR_COOKIE, await createEditorToken(), COOKIE_OPTIONS);
  clearSiteCookie(cookieStore);
  redirect("/");
}

export async function signOut() {
  const cookieStore = await cookies();
  cookieStore.delete(EDITOR_COOKIE);
  clearSiteCookie(cookieStore);
  redirect("/login");
}

export async function switchSite(siteId: string, pathname: string) {
  const { supabase, error } = await editorDb();
  if (error || !supabase) return { ok: false, error: error ?? "Sign in required." };
  const { data, error: siteError } = await supabase.from("sites").select("id").eq("id", siteId).maybeSingle();
  if (siteError) return { ok: false, error: siteError.message };
  if (!data) return { ok: false, error: "That site is not in the database." };
  const cookieStore = await cookies();
  cookieStore.set(SITE_COOKIE, siteId, SITE_COOKIE_OPTIONS);
  const section = pathname.split("/").filter(Boolean)[0] as StudioSection;
  const allowed = siteSections(siteId);
  const dest = allowed.includes(section) ? `/${section}` : "/";
  redirect(dest);
}

export async function clearSelectedSite() {
  const cookieStore = await cookies();
  clearSiteCookie(cookieStore);
  redirect("/");
}

export async function addSite(input: { id: string; name: string; domain: string }): Promise<ActionResult> {
  const { supabase, error: authError } = await editorDb();
  if (authError || !supabase) return { ok: false, error: authError ?? "Sign in required." };
  const id = input.id.trim().toLowerCase();
  const name = input.name.trim();
  const domain = cleanDomain(input.domain);
  if (!isSiteId(id)) {
    return { ok: false, error: "Site id must be lowercase letters, numbers, and hyphens, like alliance-square." };
  }
  if (!name) return { ok: false, error: "Enter the site name." };
  if (!isDomain(domain)) return { ok: false, error: "Enter a domain like alliancesquare.com." };

  const { error } = await supabase.from("sites").insert({ id, name, domain });
  if (error) {
    if (error.code === "23505") return { ok: false, error: "That site id already exists." };
    return { ok: false, error: error.message };
  }
  const settings = await supabase.from("site_settings").insert({
    site_id: id,
    content: blankHomepage(),
  });
  if (settings.error) return { ok: false, error: settings.error.message };

  const cookieStore = await cookies();
  cookieStore.set(SITE_COOKIE, id, SITE_COOKIE_OPTIONS);
  revalidatePath("/");
  redirect("/");
}

async function guardSite(siteId: string) {
  const { supabase, error } = await editorDb();
  if (error || !supabase) return { supabase: null, error: error ?? "Sign in required." };
  const selected = await selectedSiteId();
  if (selected && selected !== siteId) {
    return { supabase: null, error: "Choose this site in the switcher, then save again." };
  }
  if (!selected) {
    const { data, error: siteError } = await supabase.from("sites").select("id").eq("id", siteId).maybeSingle();
    if (siteError) return { supabase: null, error: siteError.message };
    if (!data) return { supabase: null, error: "That site is not in the database." };
    const cookieStore = await cookies();
    cookieStore.set(SITE_COOKIE, siteId, SITE_COOKIE_OPTIONS);
  }
  return { supabase, error: null };
}

async function slugTaken(
  supabase: SupabaseClient,
  table: "projects" | "insights",
  siteId: string,
  slug: string,
  id: string,
) {
  const { data, error } = await supabase.from(table).select("id, content").eq("site_id", siteId);
  if (error) return error.message;
  const clash = (data ?? []).find((row) => {
    const content = row.content as { slug?: string };
    return row.id !== id && content?.slug === slug;
  });
  return clash ? "Another record on this site already uses that slug." : null;
}

export async function saveProject(siteId: string, draft: ProjectContent, existingId?: string): Promise<ActionResult> {
  const { supabase, error: guardError } = await guardSite(siteId);
  if (!supabase) return { ok: false, error: guardError ?? "Could not save." };
  const parsed = normalizeProject(draft, { existingId });
  if (!parsed.content) return { ok: false, error: parsed.error };

  const clash = await slugTaken(supabase, "projects", siteId, parsed.content.slug, parsed.content.id);
  if (clash) return { ok: false, error: clash };

  let position = 0;
  if (existingId) {
    const current = await supabase
      .from("projects")
      .select("position")
      .eq("site_id", siteId)
      .eq("id", existingId)
      .maybeSingle();
    if (current.error) return { ok: false, error: current.error.message };
    position = (current.data?.position as number | undefined) ?? (await nextPosition(supabase, "projects", siteId));
  } else {
    position = await nextPosition(supabase, "projects", siteId);
  }

  const { error } = await supabase.from("projects").upsert({
    site_id: siteId,
    id: parsed.content.id,
    position,
    content: parsed.content,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/layouts");
  revalidatePath(`/layouts/${parsed.content.id}`);
  revalidatePath("/");
  return { ok: true, id: parsed.content.id };
}

export async function deleteProject(siteId: string, id: string): Promise<ActionResult> {
  const { supabase, error: guardError } = await guardSite(siteId);
  if (!supabase) return { ok: false, error: guardError ?? "Could not delete." };
  const { error } = await supabase.from("projects").delete().eq("site_id", siteId).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/layouts");
  revalidatePath("/");
  return { ok: true };
}

export async function saveInsight(siteId: string, draft: InsightContent, existingId?: string): Promise<ActionResult> {
  const { supabase, error: guardError } = await guardSite(siteId);
  if (!supabase) return { ok: false, error: guardError ?? "Could not save." };
  const parsed = normalizeInsight(draft, { existingId });
  if (!parsed.content) return { ok: false, error: parsed.error };
  const clash = await slugTaken(supabase, "insights", siteId, parsed.content.slug, parsed.content.id);
  if (clash) return { ok: false, error: clash };

  let position = 0;
  if (existingId) {
    const current = await supabase.from("insights").select("position").eq("site_id", siteId).eq("id", existingId).maybeSingle();
    if (current.error) return { ok: false, error: current.error.message };
    position = (current.data?.position as number | undefined) ?? (await nextPosition(supabase, "insights", siteId));
  } else {
    position = await nextPosition(supabase, "insights", siteId);
  }

  const { error } = await supabase.from("insights").upsert({
    site_id: siteId,
    id: parsed.content.id,
    position,
    content: parsed.content,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/insights");
  revalidatePath(`/insights/${parsed.content.id}`);
  revalidatePath("/");
  return { ok: true, id: parsed.content.id };
}

export async function deleteInsight(siteId: string, id: string): Promise<ActionResult> {
  const { supabase, error: guardError } = await guardSite(siteId);
  if (!supabase) return { ok: false, error: guardError ?? "Could not delete." };
  const { error } = await supabase.from("insights").delete().eq("site_id", siteId).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/insights");
  revalidatePath("/");
  return { ok: true };
}

export async function saveTestimonial(
  siteId: string,
  draft: TestimonialContent,
  existingId?: string,
): Promise<ActionResult> {
  const { supabase, error: guardError } = await guardSite(siteId);
  if (!supabase) return { ok: false, error: guardError ?? "Could not save." };
  const parsed = normalizeTestimonial(draft, { existingId });
  if (!parsed.content) return { ok: false, error: parsed.error };

  if (!existingId) {
    const { data, error } = await supabase.from("testimonials").select("id").eq("site_id", siteId);
    if (error) return { ok: false, error: error.message };
    const taken = new Set((data ?? []).map((row) => row.id as string));
    let id = parsed.content.id;
    let n = 2;
    while (taken.has(id)) {
      id = `${parsed.content.id}-${n}`;
      n += 1;
    }
    parsed.content.id = id;
  }

  let position = 0;
  if (existingId) {
    const current = await supabase
      .from("testimonials")
      .select("position")
      .eq("site_id", siteId)
      .eq("id", existingId)
      .maybeSingle();
    if (current.error) return { ok: false, error: current.error.message };
    position = (current.data?.position as number | undefined) ?? (await nextPosition(supabase, "testimonials", siteId));
  } else {
    position = await nextPosition(supabase, "testimonials", siteId);
  }

  const { error } = await supabase.from("testimonials").upsert({
    site_id: siteId,
    id: parsed.content.id,
    position,
    content: parsed.content,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/testimonials");
  revalidatePath(`/testimonials/${parsed.content.id}`);
  revalidatePath("/");
  return { ok: true, id: parsed.content.id };
}

export async function deleteTestimonial(siteId: string, id: string): Promise<ActionResult> {
  const { supabase, error: guardError } = await guardSite(siteId);
  if (!supabase) return { ok: false, error: guardError ?? "Could not delete." };
  const { error } = await supabase.from("testimonials").delete().eq("site_id", siteId).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/testimonials");
  revalidatePath("/");
  return { ok: true };
}

export async function saveHomepage(siteId: string, draft: HomepageContent): Promise<ActionResult> {
  const { supabase, error: guardError } = await guardSite(siteId);
  if (!supabase) return { ok: false, error: guardError ?? "Could not save." };
  const parsed = normalizeHomepage(draft);
  if (!parsed.content) return { ok: false, error: parsed.error };
  const { error } = await supabase.from("site_settings").upsert({
    site_id: siteId,
    content: parsed.content,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/homepage");
  revalidatePath("/");
  return { ok: true };
}

function storageFolder(siteId: string, folder: string) {
  if (!isSiteId(siteId) || !/^[a-z0-9/-]+$/.test(folder) || folder.includes("..")) return null;
  return `${siteId}/${folder}`;
}

export async function uploadCmsImage(siteId: string, folder: string, formData: FormData) {
  const { supabase, error: guardError } = await guardSite(siteId);
  if (!supabase) return { error: guardError ?? "Could not upload." };
  const prefix = storageFolder(siteId, folder);
  if (!prefix) return { error: "That upload folder is not allowed." };
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Choose an image file." };
  if (!file.type.startsWith("image/")) return { error: "Choose an image file." };
  if (file.size > 10 * 1024 * 1024) return { error: "Images need to be 10 MB or smaller." };
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("cms-media").upload(path, Buffer.from(await file.arrayBuffer()), {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) return { error: error.message };
  return { url: supabase.storage.from("cms-media").getPublicUrl(path).data.publicUrl };
}

export async function uploadCmsPdf(siteId: string, folder: string, formData: FormData) {
  const { supabase, error: guardError } = await guardSite(siteId);
  if (!supabase) return { error: guardError ?? "Could not upload." };
  const prefix = storageFolder(siteId, folder);
  if (!prefix) return { error: "That upload folder is not allowed." };
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "Choose a PDF file." };
  const namedPdf = file.name.toLowerCase().endsWith(".pdf");
  if (file.type !== "application/pdf" && !(namedPdf && (file.type === "" || file.type === "application/octet-stream"))) {
    return { error: "Choose a PDF file." };
  }
  if (file.size > 40 * 1024 * 1024) return { error: "PDFs need to be 40 MB or smaller." };
  const path = `${prefix}/${crypto.randomUUID()}.pdf`;
  const { error } = await supabase.storage.from("cms-media").upload(path, Buffer.from(await file.arrayBuffer()), {
    cacheControl: "3600",
    upsert: false,
    contentType: "application/pdf",
  });
  if (error) return { error: error.message };
  return { url: supabase.storage.from("cms-media").getPublicUrl(path).data.publicUrl };
}

export async function removeCmsImage(siteId: string, url: string) {
  const { supabase, error: guardError } = await guardSite(siteId);
  if (!supabase) return { error: guardError ?? "Could not remove the image." };
  const objectPath = storagePathFromPublicUrl(url);
  if (!objectPath || !objectPath.startsWith(`${siteId}/`)) return { ok: true as const };
  const { error } = await supabase.storage.from("cms-media").remove([objectPath]);
  if (error) return { error: error.message };
  return { ok: true as const };
}
