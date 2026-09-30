import Link from "next/link";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0077A8]">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-[#0B2341]">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-[#5C6B7A]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-[#16324F]">{label}</span>
      {children}
      {hint ? <span className="text-xs leading-5 text-[#5C6B7A]">{hint}</span> : null}
    </label>
  );
}

export function SaveBar({
  pending,
  error,
  saved,
  disabled,
}: {
  pending: boolean;
  error: string;
  saved: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="sticky bottom-4 z-20 mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-[#E4E9ED] bg-white/95 px-4 py-3 shadow-[0_12px_40px_rgba(11,35,65,0.12)] backdrop-blur">
      <button className="btn btn-primary" type="submit" disabled={pending || disabled}>
        {pending ? "Saving…" : "Save"}
      </button>
      <p className="text-sm" aria-live="polite">
        {error ? (
          <span className="text-[#9F2D2D]">{error}</span>
        ) : saved ? (
          <span className="text-[#0E7A4B]">Saved for this site.</span>
        ) : (
          <span className="text-[#5C6B7A]">Saves to the selected site only.</span>
        )}
      </p>
    </div>
  );
}

export function StringList({
  label,
  hint,
  values,
  onChange,
  multiline = false,
  addLabel = "Add",
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (values: string[]) => void;
  multiline?: boolean;
  addLabel?: string;
}) {
  return (
    <div className="grid gap-2">
      <div>
        <p className="text-sm font-medium text-[#16324F]">{label}</p>
        {hint ? <p className="text-xs leading-5 text-[#5C6B7A]">{hint}</p> : null}
      </div>
      {values.map((value, index) => (
        <div key={`${index}-${values.length}`} className="flex items-start gap-2">
          {multiline ? (
            <textarea
              className="textarea min-h-20"
              value={value}
              onChange={(event) => onChange(values.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
            />
          ) : (
            <input
              className="input"
              value={value}
              onChange={(event) => onChange(values.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))}
            />
          )}
          <button type="button" className="btn btn-danger shrink-0" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}>
            Remove
          </button>
        </div>
      ))}
      <div>
        <button type="button" className="btn btn-secondary" onClick={() => onChange([...values, ""])}>
          {addLabel}
        </button>
      </div>
    </div>
  );
}

export function ChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T[];
  onChange: (value: T[]) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-[#16324F]">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value.includes(option.value);
          return (
            <label key={option.value} className={checked ? "chip chip-on" : "chip"}>
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => {
                  const next = new Set(value);
                  if (checked) next.delete(option.value);
                  else next.add(option.value);
                  onChange(options.map((item) => item.value).filter((item) => next.has(item)));
                }}
              />
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-xl border border-[#D5DEE6] bg-white px-3 py-2 text-sm text-[#16324F]">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4 accent-[#0B2341]" />
      {label}
    </label>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <p className="card text-sm text-[#5C6B7A]">{children}</p>;
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm font-medium text-[#0077A8] hover:text-[#0B2341]">
      {children}
    </Link>
  );
}
