import { HomepageForm } from "@/components/homepage-form";
import { getHomepage, requireEditingSite } from "@/lib/data";

export default async function HomepagePage() {
  const site = await requireEditingSite();
  const homepage = await getHomepage(site.id);
  return <HomepageForm key={site.id} site={site} initial={homepage} />;
}
