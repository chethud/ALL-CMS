"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveInsight } from "@/app/actions";
import { SingleImageField } from "@/components/media-fields";
import { BackLink, Field, SaveBar, StringList } from "@/components/ui";
import { normalizeInsight, slugInput, slugify, type InsightContent } from "@/lib/content";
import type { Site } from "@/lib/site";

export function InsightForm({ site, initial }: { site: Site; initial: InsightContent | null }) {
  const router = useRouter();
  const existingId = initial?.id;
  const [draft, setDraft] = useState<InsightContent>(
    initial ?? {
      id: "",
      slug: "",
      title: "",
      excerpt: "",
      category: "",
      date: new Date().toISOString().slice(0, 10),
      image: "",
      body: [],
      source: "",
    },
  );
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(0);
  const [pending, startTransition] = useTransition();

  function patch(partial: Partial<InsightContent>) {
    setSaved(false);
    setDraft((current) => ({ ...current, ...partial }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = normalizeInsight(draft, existingId ? { existingId } : undefined);
    if (!parsed.content) {
      setError(parsed.error);
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await saveInsight(site.id, parsed.content, existingId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      if (!existingId && result.id) router.push(`/insights/${result.id}`);
      else router.refresh();
    });
  }

  const blog = site.id === "safe-wheels-group";

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <BackLink href="/insights">{blog ? "All articles" : "All insights"}</BackLink>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0B2341]">{existingId ? draft.title || (blog ? "Article" : "Insight") : blog ? "New article" : "New insight"}</h1>
        <p className="mt-1 text-sm text-[#5C6B7A]">Editing {site.name} only.</p>
      </div>
      <section className="card grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <input
              className="input"
              value={draft.title}
              onChange={(event) => {
                const title = event.target.value;
                patch({ title, slug: slugTouched ? draft.slug : slugify(title) });
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <input className="input" value={draft.category} onChange={(event) => patch({ category: event.target.value })} />
          </Field>
          <Field label="Date">
            <input className="input" type="date" value={draft.date} onChange={(event) => patch({ date: event.target.value })} />
          </Field>
        </div>
        <Field label="Excerpt">
          <textarea className="textarea" value={draft.excerpt} onChange={(event) => patch({ excerpt: event.target.value })} />
        </Field>
        <StringList label="Body" hint="Each block is one paragraph." values={draft.body} onChange={(body) => patch({ body })} addLabel="Add paragraph" multiline />
        <SingleImageField
          label="Image"
          url={draft.image}
          domain={site.domain}
          siteId={site.id}
          folder={`insights/${draft.slug || "draft"}`}
          onChange={(image) => patch({ image })}
          onBusy={(delta) => setBusy((count) => count + delta)}
        />
        {blog ? (
          <Field label="Original post" hint="Link back to the post on safewheelsgroup.com.">
            <input className="input" value={draft.source} onChange={(event) => patch({ source: event.target.value })} />
          </Field>
        ) : null}
      </section>
      <SaveBar pending={pending} error={error} saved={saved} disabled={busy > 0} />
    </form>
  );
}
