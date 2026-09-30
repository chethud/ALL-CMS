"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { clearSelectedSite, signOut, switchSite } from "@/app/actions";
import type { Site } from "@/lib/site";

const NAV = [
  { href: "/layouts", label: "Layouts" },
  { href: "/insights", label: "Insights" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/homepage", label: "Homepage" },
];

export function Shell({
  sites,
  site,
  dbError,
  children,
}: {
  sites: Site[];
  site: Site | null;
  dbError: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Header sites={sites} site={site} />
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {dbError ? (
          <div className="card max-w-2xl">
            <h1 className="text-xl font-semibold text-[#0B2341]">Database is not ready</h1>
            <p className="mt-2 text-sm leading-6 text-[#5C6B7A]">
              Run <code className="text-[#0B2341]">supabase/schema.sql</code> in the Supabase SQL editor, then run{" "}
              <code className="text-[#0B2341]">npm run seed</code>.
            </p>
            <p className="mt-3 text-sm text-[#9F2D2D]">{dbError}</p>
          </div>
        ) : (
          children
        )}
      </main>
    </div>
  );
}

function Header({ sites, site }: { sites: Site[]; site: Site | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0B2341] text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3 sm:px-6">
        {site ? (
          <form action={clearSelectedSite}>
            <button
              className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/15"
              type="submit"
            >
              ← Back
            </button>
          </form>
        ) : null}
        <form action={clearSelectedSite}>
          <button className="leading-tight text-left" type="submit">
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8FBFDC]">All sites</span>
            <span className="block text-base font-semibold">Content studio</span>
          </button>
        </form>
        {sites.length > 0 ? <SiteSwitcher sites={sites} currentId={site?.id ?? ""} /> : null}
        <div className="ml-auto flex items-center gap-2 text-sm sm:gap-3">
          {site ? (
            <a className="text-[#D5E8F3] hover:text-white" href={`https://${site.domain}`} target="_blank" rel="noreferrer">
              Open site
            </a>
          ) : null}
          <form action={signOut}>
            <button className="rounded-lg px-2 py-1 text-white/80 hover:bg-white/10 hover:text-white" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </div>
      {site ? (
        <nav className="mx-auto flex w-full max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`border-b-2 px-3 py-3 text-sm font-semibold ${
                  active ? "border-[#00A9E8] text-white" : "border-transparent text-[#B7C9D6] hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}
    </header>
  );
}

function SiteSwitcher({ sites, currentId }: { sites: Site[]; currentId: string }) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <label className="flex min-w-[220px] flex-1 items-center gap-2 sm:max-w-md">
      <span className="sr-only">Site</span>
      <select
        className="h-10 w-full rounded-xl bg-white px-3 text-sm font-medium text-[#0B2341] outline-none"
        value={currentId}
        disabled={pending}
        onChange={(event) => {
          const siteId = event.target.value;
          if (!siteId) return;
          startTransition(async () => {
            await switchSite(siteId, pathname === "/" ? "/" : pathname);
          });
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
  );
}
