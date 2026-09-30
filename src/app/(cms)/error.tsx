"use client";

export default function CmsError({ error }: { error: Error }) {
  return (
    <div className="card max-w-lg">
      <h1 className="text-xl font-semibold text-[#0B2341]">This page could not load</h1>
      <p className="mt-2 text-sm text-[#9F2D2D]">{error.message}</p>
    </div>
  );
}
