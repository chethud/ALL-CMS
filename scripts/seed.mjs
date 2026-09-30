import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv(".env.local");
loadEnv(".env");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local, then run npm run seed again.");
  process.exit(1);
}

const siteId = "alliance-square";
const siteName = "Alliance Square";
const siteDomain = "alliance-square.vercel.app";
const supabase = createClient(url, key, { auth: { persistSession: false } });

function contentRoot() {
  const options = [
    path.join("C:\\Users\\HARSHITH V MALIPATIL\\OneDrive\\Desktop\\chethu workspace\\Alliance Square", "src", "content"),
    path.join(process.cwd(), "..", "Alliance Square", "src", "content"),
    path.join(process.cwd(), "seed", "alliance-square"),
  ];
  const found = options.find((dir) => existsSync(path.join(dir, "cms-projects.json")));
  if (!found) {
    throw new Error("Could not find Alliance Square content files.");
  }
  return found;
}

const root = contentRoot();
console.log(`Reading Alliance Square content from ${root}`);

function readJson(name) {
  return JSON.parse(readFileSync(path.join(root, name), "utf8"));
}

async function upsertRows(table, rows) {
  const { error } = await supabase.from(table).upsert(rows, { onConflict: "site_id,id" });
  if (error) throw new Error(`${table}: ${error.message}`);
  console.log(`${table}: upserted ${rows.length} rows for ${siteId}`);
}

const projects = readJson("cms-projects.json");
const insights = readJson("insights.json");
const testimonials = readJson("testimonials.json");
const homepage = readJson("site.json");

const { error: siteError } = await supabase.from("sites").upsert(
  { id: siteId, name: siteName, domain: siteDomain },
  { onConflict: "id" },
);
if (siteError) throw new Error(`sites: ${siteError.message}`);
console.log(`sites: ${siteId} → ${siteDomain}`);

await upsertRows(
  "projects",
  projects.map((content, position) => ({ site_id: siteId, id: content.id, position, content })),
);
await upsertRows(
  "insights",
  insights.map((content, position) => ({ site_id: siteId, id: content.id, position, content })),
);
await upsertRows(
  "testimonials",
  testimonials.map((content, position) => ({ site_id: siteId, id: content.id, position, content })),
);

const { error: settingsError } = await supabase.from("site_settings").upsert(
  { site_id: siteId, content: homepage },
  { onConflict: "site_id" },
);
if (settingsError) throw new Error(`site_settings: ${settingsError.message}`);
console.log("site_settings: upserted homepage");

console.log("Alliance Square import finished. Other sites were not changed.");
