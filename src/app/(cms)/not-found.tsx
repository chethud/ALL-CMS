import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card max-w-lg">
      <h1 className="text-xl font-semibold text-[#0B2341]">That record is not on this site</h1>
      <p className="mt-2 text-sm text-[#5C6B7A]">It may belong to another website, or it has been deleted.</p>
      <Link href="/" className="btn btn-primary mt-4">
        Back to the site
      </Link>
    </div>
  );
}
