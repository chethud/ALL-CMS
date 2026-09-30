import Link from "next/link";
import { AddSiteForm } from "@/components/add-site-form";
import { ChooseSiteForm } from "@/components/choose-site-form";
import { currentSiteContext, siteCounts } from "@/lib/data";
import { siteSections } from "@/lib/site";

export default async function HomePage() {
  const { site, sites, error } = await currentSiteContext();
  if (error) return null;
  if (!site) {
    return (
      <div className="mx-auto max-w-3xl">
        {sites.length > 0 ? (
          <>
            <h1 className="text-2xl font-semibold text-[#0B2341]">Select a company</h1>
            <p className="mb-6 mt-2 text-sm leading-6 text-[#5C6B7A]">
              Click a company logo to open that website.
            </p>
            <ChooseSiteForm sites={sites} />
            <details className="card mt-6">
              <summary className="cursor-pointer text-sm font-semibold text-[#0B2341]">Add another website</summary>
              <p className="mb-4 mt-2 text-sm leading-6 text-[#5C6B7A]">
                The new site gets the same screens. Every row is tagged with its site id.
              </p>
              <AddSiteForm />
            </details>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-[#0B2341]">Add the first site</h1>
            <p className="mb-6 mt-2 text-sm leading-6 text-[#5C6B7A]">
              Alliance Square uses site id <strong>alliance-square</strong>, name Alliance Square, and domain
              alliance-square.vercel.app. After the seed script, it appears here so you can select it.
            </p>
            <div className="card">
              <AddSiteForm />
            </div>
          </>
        )}
      </div>
    );
  }

  const counts = await siteCounts(site.id);
  const sections = siteSections(site.id);
  const cards = [
    { href: "/layouts", section: "layouts" as const, label: "Layouts", value: String(counts.projects), detail: "Projects, gallery, and videos" },
    { href: "/insights", section: "insights" as const, label: "Insights", value: String(counts.insights), detail: "Articles" },
    { href: "/testimonials", section: "testimonials" as const, label: "Testimonials", value: String(counts.testimonials), detail: "Reviews" },
    {
      href: "/homepage",
      section: "homepage" as const,
      label: "Homepage",
      value: counts.homepage?.heroVideoId || "—",
      detail: counts.homepage
        ? `${counts.homepage.stats.years} years · ${counts.homepage.stats.layouts} layouts · ${counts.homepage.stats.customers} customers`
        : "Hero video and stats",
    },
  ].filter((card) => sections.includes(card.section));
  const insightsOnly = sections.length === 1 && sections[0] === "insights";

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0077A8]">{site.domain}</p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#0B2341]">{site.name}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5C6B7A]">
        {insightsOnly
          ? "Articles for this site are edited here."
          : "Edits on the next screens are saved for this site only. Other websites can use a different set of screens."}
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="card block transition hover:-translate-y-0.5 hover:border-[#00A9E8]">
            <p className="text-sm font-medium text-[#5C6B7A]">{card.label}</p>
            <p className="mt-2 truncate text-2xl font-semibold text-[#0B2341]">{card.value}</p>
            <p className="mt-1 text-sm text-[#5C6B7A]">{card.detail}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
