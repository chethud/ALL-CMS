import { InsightForm } from "@/components/insight-form";
import { requireEditingSite } from "@/lib/data";

export default async function NewInsightPage() {
  const site = await requireEditingSite();
  return <InsightForm site={site} initial={null} />;
}
