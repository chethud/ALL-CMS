import { requireSection } from "@/lib/data";

export default async function TestimonialsSectionLayout({ children }: { children: React.ReactNode }) {
  await requireSection("testimonials");
  return children;
}
