"use client";

import { useState, useTransition } from "react";
import { addSite } from "@/app/actions";
import { Field } from "@/components/ui";

export function AddSiteForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        startTransition(async () => {
          const result = await addSite({ id, name, domain });
          if (result && !result.ok) setError(result.error);
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Site name">
          <input className="input" value={name} onChange={(event) => setName(event.target.value)} placeholder="Alliance Square" />
        </Field>
        <Field label="Domain">
          <input className="input" value={domain} onChange={(event) => setDomain(event.target.value)} placeholder="alliance-square.vercel.app" />
        </Field>
        <Field label="Site id" hint="Lowercase, used on every row. Example: alliance-square.">
          <input className="input" value={id} onChange={(event) => setId(event.target.value.toLowerCase())} placeholder="alliance-square" />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" type="submit" disabled={pending}>
          {pending ? "Adding…" : "Add site"}
        </button>
        {error ? <p className="text-sm text-[#9F2D2D]">{error}</p> : null}
      </div>
    </form>
  );
}
