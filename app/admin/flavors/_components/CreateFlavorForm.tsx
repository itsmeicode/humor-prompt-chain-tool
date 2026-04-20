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
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-3">
      <div>
        <label
          htmlFor="new-flavor-slug"
          className="block text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
        >
          Slug
        </label>
        <input
          id="new-flavor-slug"
          name="slug"
          required
          placeholder="e.g. dry-wit, absurd-observations"
          disabled={pending}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>
      <div>
        <label
          htmlFor="new-flavor-description"
          className="block text-xs font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400"
        >
          Description (optional)
        </label>
        <textarea
          id="new-flavor-description"
          name="description"
          rows={2}
          placeholder="What kind of humor is this?"
          disabled={pending}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        {error ? (
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        ) : (
          <span />
        )}
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {pending ? "Creating…" : "Create flavor"}
        </button>
      </div>
    </form>
  );
}
