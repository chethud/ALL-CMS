"use client";

import { useState, useTransition } from "react";
import { switchSite } from "@/app/actions";
import type { Site } from "@/lib/site";

export function ChooseSiteForm({ sites }: { sites: Site[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [siteId, setSiteId] = useState("");

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        if (!siteId) {
          setError("Select a company first.");
          return;
        }
        startTransition(async () => {
          const result = await switchSite(siteId, "/");
          if (result && !result.ok) setError(result.error);
        });
      }}
    >
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-[#16324F]">Company</span>
        <select
          className="input"
          value={siteId}
          disabled={pending}
          onChange={(event) => {
            setSiteId(event.target.value);
            setError("");
          }}
        >
          <option value="">Select a company</option>
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name} · {site.domain}
            </option>
          ))}
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" type="submit" disabled={pending || !siteId}>
          {pending ? "Opening…" : "Continue"}
        </button>
        {error ? <p className="text-sm text-[#9F2D2D]">{error}</p> : null}
      </div>
    </form>
  );
}
