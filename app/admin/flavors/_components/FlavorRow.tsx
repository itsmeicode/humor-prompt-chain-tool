"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteFlavor, updateFlavor } from "../actions";

export type FlavorRowData = {
  id: string | number;
  slug: string;
  description: string | null;
  created_datetime_utc?: string | null;
};

export function FlavorRow({ flavor }: { flavor: FlavorRowData }) {
  const [editing, setEditing] = useState(false);
  const [slug, setSlug] = useState(flavor.slug ?? "");
  const [description, setDescription] = useState(flavor.description ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSave() {
    setError(null);
    const fd = new FormData();
    fd.set("id", String(flavor.id));
    fd.set("slug", slug);
    fd.set("description", description);
    startTransition(async () => {
      const res = await updateFlavor(fd);
      if (res.error) setError(res.error);
      else setEditing(false);
    });
  }

  function onDelete() {
    if (
      !confirm(
        `Delete flavor "${flavor.slug}"? This also deletes all of its steps.`
      )
    ) {
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set("id", String(flavor.id));
    startTransition(async () => {
      const res = await deleteFlavor(fd);
      if (res.error) setError(res.error);
    });
  }

  return (
    <tr className="border-t border-zinc-200 align-top dark:border-zinc-800">
      <td className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
        {String(flavor.id)}
      </td>
      <td className="px-4 py-3">
        {editing ? (
          <div className="flex flex-col gap-2">
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              disabled={pending}
              autoFocus
              placeholder="slug"
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={pending}
              rows={2}
              placeholder="description (optional)"
              className="w-full rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            />
          </div>
        ) : (
          <div>
            <Link
              href={`/admin/flavors/${flavor.id}`}
              className="text-sm font-medium text-zinc-900 underline underline-offset-2 hover:text-zinc-600 dark:text-zinc-100 dark:hover:text-zinc-300"
            >
              {flavor.slug || (
                <span className="italic text-zinc-500">(no slug)</span>
              )}
            </Link>
            {flavor.description && (
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {flavor.description}
              </p>
            )}
          </div>
        )}
        {error && (
          <p className="mt-1 text-xs text-red-700 dark:text-red-300">{error}</p>
        )}
      </td>
      <td className="px-4 py-3 text-right text-sm">
        {editing ? (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={pending}
              className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEditing(false);
                setSlug(flavor.slug ?? "");
                setDescription(flavor.description ?? "");
                setError(null);
              }}
              disabled={pending}
              className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              disabled={pending}
              className="rounded-md border border-zinc-300 px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="rounded-md border border-red-300 px-3 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950"
            >
              {pending ? "…" : "Delete"}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}
