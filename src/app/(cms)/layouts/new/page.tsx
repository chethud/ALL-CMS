import { LayoutForm, NewsletterIssueForm } from "@/components/layout-form";
import { requireEditingSite } from "@/lib/data";

export default async function NewLayoutPage() {
  const site = await requireEditingSite();
  if (site.id === "safe-wheels-group") return <NewsletterIssueForm site={site} initial={null} />;
  return <LayoutForm site={site} initial={null} />;
}
