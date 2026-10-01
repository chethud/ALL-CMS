"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveProject } from "@/app/actions";
import { GalleryField, PdfField, SingleImageField } from "@/components/media-fields";
import { BackLink, ChoiceGroup, Field, SaveBar, StringList, Toggle } from "@/components/ui";
import { normalizeProject, slugInput, slugify, type ProjectContent } from "@/lib/content";
import type { Site } from "@/lib/site";
import { APPROVALS, FILTER_LABELS, FILTERS } from "@/lib/types";
import { addGalleryVideo, parseYouTubeId, watchUrl } from "@/lib/youtube";

export function NewsletterIssueForm({ site, initial }: { site: Site; initial: ProjectContent | null }) {
  const router = useRouter();
  const existingId = initial?.id;
  const [draft, setDraft] = useState<ProjectContent>(initial ?? blank());
  const [year, setYear] = useState(issueYear(initial));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(0);
  const [pending, startTransition] = useTransition();

  function patch(partial: Partial<ProjectContent>) {
    setSaved(false);
    setDraft((current) => ({ ...current, ...partial }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const name = draft.name.trim();
    const link = draft.brochureUrl.trim();
    const cover = draft.heroImage.trim();
    const issue = year.trim();
    if (!name) {
      setError("Enter the issue name.");
      return;
    }
    if (!/^20\d{2}$/.test(issue)) {
      setError("Enter the year, such as 2026.");
      return;
    }
    if (!link) {
      setError("Upload the PDF.");
      return;
    }
    if (!cover) {
      setError("Add the cover image.");
      return;
    }
    const next: ProjectContent = {
      ...draft,
      name,
      slug: draft.slug || slugify(name),
      tagline: issue,
      brochureUrl: link,
      heroImage: cover,
      showOnLayouts: true,
      location: { ...draft.location, area: issue },
    };
    const parsed = normalizeProject(next, existingId ? { existingId } : undefined);
    if (!parsed.content) {
      setError(parsed.error);
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await saveProject(site.id, parsed.content, existingId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      if (!existingId && result.id) router.push(`/layouts/${result.id}`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid max-w-xl gap-5">
      <BackLink href="/layouts">All newsletters</BackLink>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0B2341]">
          {existingId ? draft.name || "Newsletter" : "New newsletter"}
        </h1>
        <p className="mt-1 text-sm text-[#5C6B7A]">A Window Seat issue needs a name, a year, a PDF, and a cover.</p>
      </div>
      <section className="card grid gap-4">
        <Field label="Name">
          <input
            className="input"
            value={draft.name}
            onChange={(event) => {
              const name = event.target.value;
              const found = name.match(/\b(20\d{2})\b/)?.[1];
              patch({ name, slug: existingId ? draft.slug : slugify(name) });
              if (found) setYear(found);
            }}
          />
        </Field>
        <Field label="Year">
          <input className="input" inputMode="numeric" value={year} onChange={(event) => setYear(event.target.value)} />
        </Field>
        <PdfField
          label="PDF"
          url={draft.brochureUrl}
          siteId={site.id}
          folder={`layouts/${draft.slug || "draft"}`}
          onChange={(brochureUrl) => patch({ brochureUrl })}
          onBusy={(delta) => setBusy((count) => count + delta)}
        />
        <SingleImageField
          label="Cover"
          url={draft.heroImage}
          domain={site.domain}
          siteId={site.id}
          folder={`layouts/${draft.slug || "draft"}`}
          onChange={(heroImage) => patch({ heroImage })}
          onBusy={(delta) => setBusy((count) => count + delta)}
        />
      </section>
      <SaveBar pending={pending} error={error} saved={saved} disabled={busy > 0} />
    </form>
  );
}

function issueYear(initial: ProjectContent | null) {
  const fromTagline = initial?.tagline.match(/\b(20\d{2})\b/)?.[1];
  const fromArea = initial?.location.area.match(/\b(20\d{2})\b/)?.[1];
  const fromName = initial?.name.match(/\b(20\d{2})\b/)?.[1];
  return fromTagline || fromArea || fromName || String(new Date().getFullYear());
}

export function LayoutForm({ site, initial }: { site: Site; initial: ProjectContent | null }) {
  const router = useRouter();
  const existingId = initial?.id;
  const [draft, setDraft] = useState<ProjectContent>(initial ?? blank());
  const [lat, setLat] = useState(initial ? String(initial.location.coordinates.lat) : "");
  const [lng, setLng] = useState(initial ? String(initial.location.coordinates.lng) : "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [videoDraft, setVideoDraft] = useState("");
  const [videoError, setVideoError] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(0);
  const [pending, startTransition] = useTransition();
  const folder = `layouts/${draft.slug || "draft"}`;
  const shortId = parseYouTubeId(draft.youtubeShortId);

  function patch(partial: Partial<ProjectContent>) {
    setSaved(false);
    setDraft((current) => ({ ...current, ...partial }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setVideoError("");
    if ((lat.trim() && !Number.isFinite(Number(lat))) || (lng.trim() && !Number.isFinite(Number(lng)))) {
      setError("Latitude and longitude need numbers, such as 12.3858889 and 76.522086.");
      return;
    }
    let next: ProjectContent = {
      ...draft,
      location: {
        ...draft.location,
        coordinates: { lat: lat.trim() ? Number(lat) : 0, lng: lng.trim() ? Number(lng) : 0 },
      },
    };
    if (videoDraft.trim()) {
      const added = addGalleryVideo(draft.youtubeGalleryIds, videoDraft);
      if (added.error) {
        setVideoError(added.error);
        return;
      }
      next = { ...next, youtubeGalleryIds: added.ids };
      setDraft(next);
      setVideoDraft("");
    }
    const parsed = normalizeProject(next, existingId ? { existingId } : undefined);
    if (!parsed.content) {
      setError(parsed.error);
      return;
    }
    startTransition(async () => {
      const result = await saveProject(site.id, parsed.content, existingId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      if (!existingId && result.id) router.push(`/layouts/${result.id}`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <BackLink href="/layouts">All layouts</BackLink>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0B2341]">{existingId ? draft.name || "Layout" : "New layout"}</h1>
        <p className="mt-1 text-sm text-[#5C6B7A]">
          {existingId ? `Record id ${existingId}. ` : "The record id will match the slug. "}
          Editing {site.name} only.
        </p>
      </div>

      <section className="card grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5C6B7A]">Project</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input
              className="input"
              value={draft.name}
              onChange={(event) => {
                const name = event.target.value;
                patch({ name, slug: slugTouched ? draft.slug : slugify(name) });
              }}
            />
          </Field>
          <Field label="Slug">
            <input
              className="input"
              value={draft.slug}
              onChange={(event) => {
                setSlugTouched(true);
                patch({ slug: slugInput(event.target.value) });
              }}
            />
          </Field>
        </div>
        <Field label="Tagline">
          <input className="input" value={draft.tagline} onChange={(event) => patch({ tagline: event.target.value })} />
        </Field>
        <Field label="Description">
          <textarea className="textarea" value={draft.description} onChange={(event) => patch({ description: event.target.value })} />
        </Field>
        <Field label="Listing description">
          <textarea className="textarea" value={draft.listingDescription} onChange={(event) => patch({ listingDescription: event.target.value })} />
        </Field>
      </section>

      <section className="card grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5C6B7A]">Location and price</h2>
        <Field label="Area">
          <input
            className="input"
            value={draft.location.area}
            onChange={(event) => patch({ location: { ...draft.location, area: event.target.value } })}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="City">
            <input
              className="input"
              value={draft.location.city}
              onChange={(event) => patch({ location: { ...draft.location, city: event.target.value } })}
            />
          </Field>
          <Field label="Latitude" hint="Map pin.">
            <input className="input" inputMode="decimal" value={lat} onChange={(event) => setLat(event.target.value)} />
          </Field>
          <Field label="Longitude">
            <input className="input" inputMode="decimal" value={lng} onChange={(event) => setLng(event.target.value)} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price per sq.ft">
            <input
              className="input"
              inputMode="decimal"
              value={draft.pricePerSqft}
              onChange={(event) => patch({ pricePerSqft: Number(event.target.value) })}
            />
          </Field>
          <Field label="Price label">
            <input className="input" value={draft.priceLabel} onChange={(event) => patch({ priceLabel: event.target.value })} />
          </Field>
        </div>
        <StringList label="Plot sizes" values={draft.plotSizes} onChange={(plotSizes) => patch({ plotSizes })} addLabel="Add size" />
      </section>

      <section className="card grid gap-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5C6B7A]">Approvals and filters</h2>
        <ChoiceGroup
          label="Approvals"
          options={APPROVALS.map((value) => ({ value, label: value }))}
          value={draft.approvals}
          onChange={(approvals) => patch({ approvals })}
        />
        <ChoiceGroup
          label="Filters"
          options={FILTERS.map((value) => ({ value, label: FILTER_LABELS[value] }))}
          value={draft.filters}
          onChange={(filters) => patch({ filters })}
        />
      </section>

      <section className="card grid gap-5">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5C6B7A]">Details</h2>
        <StringList label="Highlights" values={draft.highlights} onChange={(highlights) => patch({ highlights })} addLabel="Add highlight" />
        <StringList label="Amenities" values={draft.amenities} onChange={(amenities) => patch({ amenities })} addLabel="Add amenity" />
        <StringList label="Facilities" values={draft.facilities} onChange={(facilities) => patch({ facilities })} addLabel="Add facility" />
        <StringList
          label="Nearby landmarks"
          values={draft.nearbyLandmarks}
          onChange={(nearbyLandmarks) => patch({ nearbyLandmarks })}
          addLabel="Add landmark"
        />
      </section>

      <section className="card grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5C6B7A]">Visibility</h2>
        <div className="flex flex-wrap gap-3">
          <Toggle label="Featured" checked={draft.featured} onChange={(featured) => patch({ featured })} />
          <Toggle label="Spotlight" checked={draft.spotlight} onChange={(spotlight) => patch({ spotlight })} />
          <Toggle label="Show on layouts page" checked={draft.showOnLayouts} onChange={(showOnLayouts) => patch({ showOnLayouts })} />
        </div>
        <Field label="Map status">
          <select
            className="input"
            value={draft.mapStatus}
            onChange={(event) => patch({ mapStatus: event.target.value === "completed" ? "completed" : "running" })}
          >
            <option value="running">Running</option>
            <option value="completed">Completed</option>
          </select>
        </Field>
      </section>

      <section className="card grid gap-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5C6B7A]">Images</h2>
          <p className="mt-1 text-xs leading-5 text-[#5C6B7A]">New files go into this site’s storage folder. Save the layout to keep the links on the project.</p>
        </div>
        <SingleImageField
          label="Hero image"
          url={draft.heroImage}
          domain={site.domain}
          siteId={site.id}
          folder={folder}
          onChange={(heroImage) => patch({ heroImage })}
          onBusy={(delta) => setBusy((count) => count + delta)}
        />
        <GalleryField
          urls={draft.gallery}
          domain={site.domain}
          siteId={site.id}
          folder={folder}
          onChange={(gallery) => patch({ gallery })}
          onBusy={(delta) => setBusy((count) => count + delta)}
        />
        <Field label="Brochure URL" hint="Paste a link, or leave this empty.">
          <input className="input" value={draft.brochureUrl} onChange={(event) => patch({ brochureUrl: event.target.value })} />
        </Field>
      </section>

      <section className="card grid gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5C6B7A]">Videos</h2>
        <Field label="Starting video" hint="Plays at the top of the project page. Clear this field to remove the video.">
          <input
            className="input"
            value={draft.youtubeShortId}
            placeholder="YouTube link or 11-character id"
            onChange={(event) => patch({ youtubeShortId: event.target.value })}
          />
        </Field>
        {shortId ? (
          <a className="text-sm text-[#0077A8]" href={watchUrl(shortId)} target="_blank" rel="noreferrer">
            {watchUrl(shortId)}
          </a>
        ) : null}

        <div className="grid gap-2">
          <p className="text-sm font-medium text-[#16324F]">Gallery videos</p>
          <p className="text-xs leading-5 text-[#5C6B7A]">Shown under the gallery. Each saved link can be removed.</p>
          {draft.youtubeGalleryIds.length === 0 ? <p className="text-sm text-[#5C6B7A]">No gallery videos yet.</p> : null}
          <ul className="grid gap-2">
            {draft.youtubeGalleryIds.map((id) => (
              <li key={id} className="flex items-center justify-between gap-3 rounded-xl border border-[#E4E9ED] px-3 py-2">
                <a className="truncate text-sm text-[#0077A8]" href={watchUrl(id)} target="_blank" rel="noreferrer">
                  {watchUrl(id)}
                </a>
                <button
                  type="button"
                  className="btn btn-danger shrink-0"
                  onClick={() => patch({ youtubeGalleryIds: draft.youtubeGalleryIds.filter((item) => item !== id) })}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="input min-w-[240px] flex-1"
              value={videoDraft}
              placeholder="YouTube link or 11-character id"
              onChange={(event) => {
                setVideoDraft(event.target.value);
                setVideoError("");
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                const added = addGalleryVideo(draft.youtubeGalleryIds, videoDraft);
                if (added.error) {
                  setVideoError(added.error);
                  return;
                }
                patch({ youtubeGalleryIds: added.ids });
                setVideoDraft("");
              }}
            />
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                const added = addGalleryVideo(draft.youtubeGalleryIds, videoDraft);
                if (added.error) {
                  setVideoError(added.error);
                  return;
                }
                patch({ youtubeGalleryIds: added.ids });
                setVideoDraft("");
              }}
            >
              Add video
            </button>
          </div>
          {videoError ? <p className="text-sm text-[#9F2D2D]">{videoError}</p> : null}
        </div>
      </section>

      <SaveBar pending={pending} error={error} saved={saved} disabled={busy > 0} />
    </form>
  );
}

function blank(): ProjectContent {
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
