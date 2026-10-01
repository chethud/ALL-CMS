import { notFound } from "next/navigation";
import { LayoutForm, NewsletterIssueForm } from "@/components/layout-form";
import { getProject, requireEditingSite } from "@/lib/data";

export default async function EditLayoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await requireEditingSite();
  const project = await getProject(site.id, id);
  if (!project) notFound();
  if (site.id === "safe-wheels-group") return <NewsletterIssueForm key={project.id} site={site} initial={project} />;
  return <LayoutForm key={project.id} site={site} initial={project} />;
}
