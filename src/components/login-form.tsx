"use client";

import { useActionState } from "react";
import { signIn } from "@/app/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, null);

  return (
    <form action={action} className="grid gap-4">
      <label className="grid gap-1.5">
        <span className="text-sm font-medium text-[#16324F]">Editor password</span>
        <input className="input" name="password" type="password" autoComplete="current-password" required />
      </label>
      {state && !state.ok ? <p className="text-sm text-[#9F2D2D]">{state.error}</p> : null}
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "Checking…" : "Continue"}
      </button>
    </form>
  );
}
