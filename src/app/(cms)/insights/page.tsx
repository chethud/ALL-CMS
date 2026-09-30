import Link from "next/link";
import { deleteInsight } from "@/app/actions";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState, PageHeader } from "@/components/ui";
import { listInsights, requireEditingSite } from "@/lib/data";

export default async function InsightsPage() {
  const site = await requireEditingSite();
  const insights = await listInsights(site.id);

  return (
    <div>
      <PageHeader
        eyebrow={site.name}
        title="Insights"
        description="Articles for this site."
        action={
          <Link href="/insights/new" className="btn btn-primary">
            New insight
          </Link>
        }
      />
      {insights.length === 0 ? (
        <EmptyState>No insights for this site yet.</EmptyState>
      ) : (
        <ul className="grid gap-3">
          {insights.map((insight) => (
            <li key={insight.id} className="card flex flex-wrap items-center gap-4 !p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/insights/${insight.id}`} className="font-semibold text-[#0B2341] hover:text-[#0077A8]">
                  {insight.title}
                </Link>
                <p className="mt-1 text-sm text-[#5C6B7A]">
                  {insight.category || "Uncategorised"} · {insight.date}
                </p>
              </div>
              <Link href={`/insights/${insight.id}`} className="btn btn-secondary">
                Edit
              </Link>
              <DeleteButton label="insight" href="/insights" action={deleteInsight.bind(null, site.id, insight.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
