import { requireSection } from "@/lib/data";

export default async function HomepageSectionLayout({ children }: { children: React.ReactNode }) {
  await requireSection("homepage");
  return children;
}
