"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  generateCaptionsForImageId,
  isSupportedImageType,
  SUPPORTED_IMAGE_TYPES,
  uploadAndGenerateCaptions,
} from "@/lib/almostcrackdApi";

export type ImageRow = {
  id: string;
  url: string | null;
  image_description: string | null;
};

type Tab = "existing" | "upload";

type Selection =
  | { source: "existing"; id: string; previewUrl: string | null }
  | { source: "upload"; file: File; previewUrl: string }
  | null;

export function TestFlavorClient({
  flavorId,
  flavorSlug,
  images,
  imagePage,
  imageTotalPages,
  imageBasePath,
}: {
  flavorId: string;
  flavorSlug: string;
  images: ImageRow[];
  imagePage: number;
  imageTotalPages: number;
  imageBasePath: string;
}) {
  const [tab, setTab] = useState<Tab>("existing");
  const [selection, setSelection] = useState<Selection>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captions, setCaptions] = useState<unknown[] | null>(null);
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptAttr = useMemo(() => SUPPORTED_IMAGE_TYPES.join(","), []);

  function handleFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isSupportedImageType(file.type)) {
      setError(
        `Unsupported file type ${file.type}. Allowed: ${SUPPORTED_IMAGE_TYPES.join(", ")}`
      );
      return;
    }
    setError(null);
    setCaptions(null);
    setResultImageUrl(null);
    setSelection({
      source: "upload",
      file,
      previewUrl: URL.createObjectURL(file),
    });
  }

  function pickExisting(img: ImageRow) {
    setError(null);
    setCaptions(null);
    setResultImageUrl(null);
    setSelection({
      source: "existing",
      id: img.id,
      previewUrl: img.url,
    });
  }

  async function onGenerate() {
    if (!selection) return;
    setError(null);
    setCaptions(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        throw new Error("Not signed in — refresh and sign in again.");
      }

      const result =
        selection.source === "existing"
          ? await generateCaptionsForImageId(token, selection.id, flavorId)
          : await uploadAndGenerateCaptions(token, selection.file, flavorId);

      setCaptions(result.captions);
      setResultImageUrl(result.cdnUrl ?? selection.previewUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function clearSelection() {
    setSelection(null);
    setCaptions(null);
    setResultImageUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-4 flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
          <button
            type="button"
            onClick={() => setTab("existing")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === "existing"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            Pick existing
          </button>
          <button
            type="button"
            onClick={() => setTab("upload")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
              tab === "upload"
                ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            Upload new
          </button>
        </div>

        {tab === "existing" ? (
          <ExistingPicker
            images={images}
            page={imagePage}
            totalPages={imageTotalPages}
            basePath={imageBasePath}
            selectedId={
              selection?.source === "existing" ? selection.id : null
            }
            onPick={pickExisting}
          />
        ) : (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptAttr}
              onChange={handleFilePick}
              className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700 dark:text-zinc-300 dark:file:bg-zinc-100 dark:file:text-zinc-900 dark:hover:file:bg-white"
            />
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Allowed: jpg, png, webp, gif, heic
            </p>
          </div>
        )}
      </section>

      {selection?.previewUrl && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-col items-start gap-4 sm:flex-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selection.previewUrl}
              alt="Selected"
              className="h-48 w-48 shrink-0 rounded-lg border border-zinc-200 object-cover dark:border-zinc-800"
            />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Selected
              </p>
              <p className="mt-1 text-sm text-zinc-900 dark:text-zinc-100">
                {selection.source === "existing"
                  ? `Existing image · ${selection.id}`
                  : `New upload · ${selection.file.name}`}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Will run flavor: <span className="font-mono">{flavorSlug}</span>
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={onGenerate}
                  disabled={loading}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  {loading ? "Generating…" : "Generate captions"}
                </button>
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={loading}
                  className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

      {captions !== null && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Generated captions
            </h2>
            <Link
              href={`/admin/flavors/${flavorId}/captions`}
              className="text-xs text-zinc-600 underline dark:text-zinc-400"
            >
              See all captions for this flavor →
            </Link>
          </div>
          {captions.length === 0 ? (
            <p className="text-sm text-zinc-500">
              The API returned an empty list.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {captions.map((c, i) => (
                <li
                  key={i}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                >
                  {renderCaption(c)}
                </li>
              ))}
            </ul>
          )}
          {resultImageUrl && (
            <details className="mt-4">
              <summary className="cursor-pointer text-xs text-zinc-500 dark:text-zinc-400">
                Raw response
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-zinc-100 p-3 text-xs text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                {JSON.stringify(captions, null, 2)}
              </pre>
            </details>
          )}
        </section>
      )}
    </div>
  );
}

function renderCaption(c: unknown): string {
  if (typeof c === "string") return c;
  if (c && typeof c === "object") {
    const obj = c as Record<string, unknown>;
    if (typeof obj.content === "string") return obj.content;
    if (typeof obj.caption === "string") return obj.caption;
    if (typeof obj.text === "string") return obj.text;
  }
  return JSON.stringify(c);
}

function ExistingPicker({
  images,
  page,
  totalPages,
  basePath,
  selectedId,
  onPick,
}: {
  images: ImageRow[];
  page: number;
  totalPages: number;
  basePath: string;
  selectedId: string | null;
  onPick: (img: ImageRow) => void;
}) {
  if (images.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        No images in the images table yet.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img) => {
          const isSelected = selectedId === img.id;
          return (
            <button
              key={img.id}
              type="button"
              onClick={() => onPick(img)}
              className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition ${
                isSelected
                  ? "border-amber-500"
                  : "border-zinc-200 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              }`}
              title={img.image_description ?? img.id}
            >
              {img.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={img.url}
                  alt={img.image_description ?? "image"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500">
                  no url
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Link
              href={`${basePath}?p=${page - 1}`}
              className="rounded-md border border-zinc-300 px-2 py-1 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              ← Prev
            </Link>
          ) : (
            <span className="rounded-md border border-zinc-200 px-2 py-1 opacity-40 dark:border-zinc-800">
              ← Prev
            </span>
          )}
          {page < totalPages ? (
            <Link
              href={`${basePath}?p=${page + 1}`}
              className="rounded-md border border-zinc-300 px-2 py-1 hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              Next →
            </Link>
          ) : (
            <span className="rounded-md border border-zinc-200 px-2 py-1 opacity-40 dark:border-zinc-800">
              Next →
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
