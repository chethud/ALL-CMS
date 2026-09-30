import { requireSection } from "@/lib/data";

export default async function LayoutsSectionLayout({ children }: { children: React.ReactNode }) {
  await requireSection("layouts");
  return children;
}
