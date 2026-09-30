"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ActionResult } from "@/app/actions";

export function DeleteButton({
  label,
  action,
  href,
}: {
  label: string;
  action: () => Promise<ActionResult>;
  href: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        className="btn btn-danger"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Delete this ${label}?`)) return;
          startTransition(async () => {
            const result = await action();
            if (!result.ok) {
              setError(result.error);
              return;
            }
            router.push(href);
            router.refresh();
          });
        }}
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error ? <p className="text-xs text-[#9F2D2D]">{error}</p> : null}
    </div>
  );
}
