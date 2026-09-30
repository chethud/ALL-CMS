"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveTestimonial } from "@/app/actions";
import { SingleImageField } from "@/components/media-fields";
import { BackLink, Field, SaveBar, Toggle } from "@/components/ui";
import { normalizeTestimonial, type TestimonialContent } from "@/lib/content";
import type { Site } from "@/lib/site";

export function TestimonialForm({ site, initial }: { site: Site; initial: TestimonialContent | null }) {
  const router = useRouter();
  const existingId = initial?.id;
  const [draft, setDraft] = useState<TestimonialContent>(
    initial ?? {
      id: "",
      name: "",
      location: "",
      quote: "",
      image: "",
      designation: "",
      verified: true,
      service: "",
    },
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(0);
  const [pending, startTransition] = useTransition();

  function patch(partial: Partial<TestimonialContent>) {
    setSaved(false);
    setDraft((current) => ({ ...current, ...partial }));
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = normalizeTestimonial(draft, existingId ? { existingId } : undefined);
    if (!parsed.content) {
      setError(parsed.error);
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await saveTestimonial(site.id, parsed.content, existingId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      if (!existingId && result.id) router.push(`/testimonials/${result.id}`);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <BackLink href="/testimonials">All testimonials</BackLink>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0B2341]">{existingId ? draft.name || "Testimonial" : "New testimonial"}</h1>
        <p className="mt-1 text-sm text-[#5C6B7A]">Editing {site.name} only.</p>
      </div>
      <section className="card grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input className="input" value={draft.name} onChange={(event) => patch({ name: event.target.value })} />
          </Field>
          <Field label="Location">
            <input className="input" value={draft.location} onChange={(event) => patch({ location: event.target.value })} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Designation">
            <input className="input" value={draft.designation} onChange={(event) => patch({ designation: event.target.value })} />
          </Field>
          <Field label="Service">
            <input className="input" value={draft.service} onChange={(event) => patch({ service: event.target.value })} />
          </Field>
        </div>
        <Field label="Quote">
          <textarea className="textarea min-h-36" value={draft.quote} onChange={(event) => patch({ quote: event.target.value })} />
        </Field>
        <Toggle label="Verified" checked={draft.verified} onChange={(verified) => patch({ verified })} />
        <SingleImageField
          label="Photo"
          url={draft.image}
          domain={site.domain}
          siteId={site.id}
          folder={`testimonials/${existingId || "draft"}`}
          onChange={(image) => patch({ image })}
          onBusy={(delta) => setBusy((count) => count + delta)}
        />
      </section>
      <SaveBar pending={pending} error={error} saved={saved} disabled={busy > 0} />
    </form>
  );
}
