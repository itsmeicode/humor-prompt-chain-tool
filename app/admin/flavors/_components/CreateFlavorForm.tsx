"use client";

import { useRef, useState, useTransition } from "react";
import { createFlavor } from "../actions";

export function CreateFlavorForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await createFlavor(fd);
      if (res.error) setError(res.error);
      else formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      <div className="flex-1">
        <label
          htmlFor="new-flavor-name"
          className="block text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
        >
          New flavor name
        </label>
        <input
          id="new-flavor-name"
          name="name"
          required
          placeholder="e.g. Dry Wit, Absurd Observations"
          disabled={pending}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {pending ? "Creating…" : "Create"}
      </button>
      {error && (
        <p className="text-xs text-red-700 dark:text-red-300 sm:self-center">
          {error}
        </p>
      )}
    </form>
  );
}
