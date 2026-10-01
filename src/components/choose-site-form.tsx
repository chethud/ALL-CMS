"use client";

import { useState, useTransition } from "react";
import { switchSite } from "@/app/actions";
import { siteLogo, type Site } from "@/lib/site";

export function ChooseSiteForm({ sites }: { sites: Site[] }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [openingId, setOpeningId] = useState("");

  return (
    <div className="grid grid-cols-3 gap-3">
      {sites.map((site) => {
        const logo = siteLogo(site.id);
        const opening = pending && openingId === site.id;
        return (
          <button
            key={site.id}
            type="button"
            disabled={pending}
            className="card flex flex-col items-center gap-2 p-3 text-center transition hover:-translate-y-0.5 hover:border-[#00A9E8] disabled:cursor-wait disabled:opacity-70"
            onClick={() => {
              setError("");
              setOpeningId(site.id);
              startTransition(async () => {
                const result = await switchSite(site.id, "/");
                if (result && !result.ok) {
                  setError(result.error);
                  setOpeningId("");
                }
              });
            }}
          >
            <span className="flex h-14 w-full items-center justify-center">
              {logo ? (
                <span
                  className={
                    logo.bg
                      ? `inline-flex h-12 items-center justify-center rounded-lg px-1.5 ${logo.bg}`
                      : "inline-flex h-12 w-full items-center justify-center"
                  }
                >
                  <img
                    src={logo.src}
                    alt=""
                    className={
                      logo.round
                        ? "h-12 w-12 rounded-full object-cover"
                        : "max-h-12 w-auto object-contain"
                    }
                  />
                </span>
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B2341] text-lg font-semibold text-white">
                  {site.name.slice(0, 1).toUpperCase()}
                </span>
              )}
            </span>
            <span>
              <span className="block text-sm font-semibold text-[#0B2341]">{site.name}</span>
              <span className="mt-0.5 block text-[11px] leading-4 text-[#5C6B7A]">{opening ? "Opening…" : site.domain}</span>
            </span>
          </button>
        );
      })}
      {error ? <p className="text-sm text-[#9F2D2D] col-span-3">{error}</p> : null}
    </div>
  );
}
