import { notFound } from "next/navigation";
import { InsightForm } from "@/components/insight-form";
import { getInsight, requireEditingSite } from "@/lib/data";

export default async function EditInsightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await requireEditingSite();
  const insight = await getInsight(site.id, id);
  if (!insight) notFound();
  return <InsightForm key={insight.id} site={site} initial={insight} />;
}
