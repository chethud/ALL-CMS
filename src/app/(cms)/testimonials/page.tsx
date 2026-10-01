import Link from "next/link";
import { deleteTestimonial } from "@/app/actions";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState, PageHeader } from "@/components/ui";
import { listTestimonials, requireEditingSite } from "@/lib/data";

export default async function TestimonialsPage() {
  const site = await requireEditingSite();
  const testimonials = await listTestimonials(site.id);

  return (
    <div>
      <PageHeader
        eyebrow={site.name}
        title="Testimonials"
        description="Reviews for this site."
        action={
          <Link href="/testimonials/new" className="btn btn-primary">
            New testimonial
          </Link>
        }
      />
      {testimonials.length === 0 ? (
        <EmptyState>No testimonials for this site yet.</EmptyState>
      ) : (
        <ul className="grid gap-3">
          {testimonials.map((item) => (
            <li key={item.id} className="card flex flex-wrap items-center gap-4 !p-4">
              <div className="min-w-0 flex-1">
                <Link href={`/testimonials/${item.id}`} className="font-semibold text-[#0B2341] hover:text-[#0077A8]">
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-[#5C6B7A]">
                  {item.location}
                  {item.rating ? ` · ${item.rating}/5` : ""}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-[#16324F]">{item.quote}</p>
              </div>
              <Link href={`/testimonials/${item.id}`} className="btn btn-secondary">
                Edit
              </Link>
              <DeleteButton label="testimonial" href="/testimonials" action={deleteTestimonial.bind(null, site.id, item.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
