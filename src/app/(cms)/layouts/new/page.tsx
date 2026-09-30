import { LayoutForm } from "@/components/layout-form";
import { requireEditingSite } from "@/lib/data";

export default async function NewLayoutPage() {
  const site = await requireEditingSite();
  return <LayoutForm site={site} initial={null} />;
}
