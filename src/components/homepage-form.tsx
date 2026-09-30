"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { saveHomepage } from "@/app/actions";
import { Field, SaveBar } from "@/components/ui";
import { normalizeHomepage, type HomepageContent } from "@/lib/content";
import type { Site } from "@/lib/site";
import { parseYouTubeId, watchUrl } from "@/lib/youtube";

export function HomepageForm({ site, initial }: { site: Site; initial: HomepageContent }) {
  const router = useRouter();
  const [draft, setDraft] = useState(initial);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const heroId = parseYouTubeId(draft.heroVideoId);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = normalizeHomepage(draft);
    if (!parsed.content) {
      setError(parsed.error);
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await saveHomepage(site.id, parsed.content);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft(parsed.content);
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-[#0B2341]">Homepage</h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5C6B7A]">
          Hero video and the numbers on the {site.name} homepage. Clear the video field to remove it.
        </p>
      </div>
      <section className="card grid gap-4">
        <Field label="Hero video" hint="YouTube watch link, youtu.be, Shorts, or an 11-character id.">
          <input
            className="input"
            value={draft.heroVideoId}
            onChange={(event) => {
              setSaved(false);
              setDraft({ ...draft, heroVideoId: event.target.value });
            }}
          />
        </Field>
        {heroId ? (
          <a className="text-sm text-[#0077A8]" href={watchUrl(heroId)} target="_blank" rel="noreferrer">
            {watchUrl(heroId)}
          </a>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Years">
            <input
              className="input"
              inputMode="numeric"
              value={draft.stats.years}
              onChange={(event) => {
                setSaved(false);
                setDraft({ ...draft, stats: { ...draft.stats, years: Number(event.target.value) } });
              }}
            />
          </Field>
          <Field label="Layouts">
            <input
              className="input"
              inputMode="numeric"
              value={draft.stats.layouts}
              onChange={(event) => {
                setSaved(false);
                setDraft({ ...draft, stats: { ...draft.stats, layouts: Number(event.target.value) } });
              }}
            />
          </Field>
          <Field label="Customers">
            <input
              className="input"
              inputMode="numeric"
              value={draft.stats.customers}
              onChange={(event) => {
                setSaved(false);
                setDraft({ ...draft, stats: { ...draft.stats, customers: Number(event.target.value) } });
              }}
            />
          </Field>
          <Field label="Customer focused">
            <input
              className="input"
              value={draft.stats.customerFocused}
              onChange={(event) => {
                setSaved(false);
                setDraft({ ...draft, stats: { ...draft.stats, customerFocused: event.target.value } });
              }}
            />
          </Field>
        </div>
      </section>
      <SaveBar pending={pending} error={error} saved={saved} />
    </form>
  );
}
