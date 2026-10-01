import Link from "next/link";
import { deleteProject } from "@/app/actions";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState, PageHeader } from "@/components/ui";
import { listProjects, requireEditingSite } from "@/lib/data";
import { resolveMediaUrl } from "@/lib/media";

export default async function LayoutsPage() {
  const site = await requireEditingSite();
  const projects = await listProjects(site.id);
  const newsletter = site.id === "safe-wheels-group";

  return (
    <div>
      <PageHeader
        eyebrow={site.name}
        title={newsletter ? "Newsletters" : "Layouts"}
        description={
          newsletter
            ? "Window Seat issues. Each one has a name, a year, a PDF, and a cover."
            : "Projects for this site. Open one to change its gallery, starting video, and gallery videos."
        }
        action={
          <Link href="/layouts/new" className="btn btn-primary">
            {newsletter ? "New newsletter" : "New layout"}
          </Link>
        }
      />
      {projects.length === 0 ? (
        <EmptyState>{newsletter ? "No newsletters for this site yet." : "No layouts for this site yet."}</EmptyState>
      ) : (
        <ul className="grid gap-3">
          {projects.map((project) => (
            <li key={project.id} className="card flex flex-wrap items-center gap-4 !p-3">
              {project.heroImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveMediaUrl(project.heroImage, site.domain)}
                  alt=""
                  className="h-16 w-24 rounded-lg bg-[#F3F6F8] object-cover"
                />
              ) : (
                <div className="h-16 w-24 rounded-lg bg-[#F3F6F8]" />
              )}
              <div className="min-w-0 flex-1">
                <Link href={`/layouts/${project.id}`} className="font-semibold text-[#0B2341] hover:text-[#0077A8]">
                  {project.name}
                </Link>
                <p className="truncate text-sm text-[#5C6B7A]">{newsletter ? project.tagline || project.location.area : project.location.area || project.slug}</p>
                {newsletter ? null : (
                  <p className="mt-1 text-xs uppercase tracking-wide text-[#5C6B7A]">
                    {project.mapStatus}
                    {" · "}
                    {project.showOnLayouts ? "On layouts" : "Hidden from layouts"}
                    {project.featured ? " · Featured" : ""}
                  </p>
                )}
              </div>
              <Link href={`/layouts/${project.id}`} className="btn btn-secondary">
                Edit
              </Link>
              <DeleteButton label={newsletter ? "newsletter" : "layout"} href="/layouts" action={deleteProject.bind(null, site.id, project.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
