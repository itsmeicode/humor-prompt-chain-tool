"use client";

import { useRef, useState, useTransition } from "react";
import { createStep } from "../actions";
import { StepFormFields, type LookupOptions } from "./StepFormFields";

export function CreateStepForm({
  flavorId,
  options,
}: {
  flavorId: string;
  options: LookupOptions;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    fd.set("flavor_id", flavorId);
    startTransition(async () => {
      const res = await createStep(fd);
      if (res.error) setError(res.error);
      else {
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
      >
        + Add a step
      </button>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4">
      <StepFormFields options={options} disabled={pending} idPrefix="new" />
      <div className="flex items-center justify-between gap-3">
        {error ? (
          <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setError(null);
              formRef.current?.reset();
            }}
            disabled={pending}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {pending ? "Adding…" : "Add step"}
          </button>
        </div>
      </div>
    </form>
  );
}
