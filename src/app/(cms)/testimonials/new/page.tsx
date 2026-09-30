import { TestimonialForm } from "@/components/testimonial-form";
import { requireEditingSite } from "@/lib/data";

export default async function NewTestimonialPage() {
  const site = await requireEditingSite();
  return <TestimonialForm site={site} initial={null} />;
}
