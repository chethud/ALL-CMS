import { notFound } from "next/navigation";
import { TestimonialForm } from "@/components/testimonial-form";
import { getTestimonial, requireEditingSite } from "@/lib/data";

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = await requireEditingSite();
  const testimonial = await getTestimonial(site.id, id);
  if (!testimonial) notFound();
  return <TestimonialForm key={testimonial.id} site={site} initial={testimonial} />;
}
