import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  TestFlavorClient,
  type ImageRow,
} from "./_components/TestFlavorClient";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export default async function TestFlavorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const pageRaw = parseInt(sp.p ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  const supabase = await createClient();

  const flavorRes = await supabase
    .from("humor_flavors")
    .select("id, slug")
    .eq("id", id)
    .maybeSingle();

  if (flavorRes.error) {
    return (
      <div className="p-6 md:p-10">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {flavorRes.error.message}
        </p>
      </div>
    );
  }
  if (!flavorRes.data) notFound();

  const from = (page - 1) * PAGE_SIZE;
  const to = page * PAGE_SIZE - 1;
  const { data: imageRows, count, error: imagesErr } = await supabase
    .from("images")
    .select("id, url, image_description", { count: "exact" })
    .order("created_datetime_utc", { ascending: false, nullsFirst: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  if (page > totalPages && (count ?? 0) > 0) {
    redirect(`/admin/flavors/${id}/test?p=${totalPages}`);
  }

  const images = (imageRows ?? []) as ImageRow[];

  return (
    <div className="w-full min-w-0 max-w-3xl p-6 md:p-10">
      <header className="mb-6">
        <Link
          href={`/admin/flavors/${id}`}
          className="text-xs text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← Back to flavor
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Test {flavorRes.data.slug}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Pick an existing image or upload a new one, then run the flavor
          through api.almostcrackd.ai to see the captions it produces.
        </p>
      </header>

      {imagesErr && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {imagesErr.message}
        </p>
      )}

      <TestFlavorClient
        flavorId={String(flavorRes.data.id)}
        flavorSlug={flavorRes.data.slug}
        images={images}
        imagePage={page}
        imageTotalPages={totalPages}
        imageBasePath={`/admin/flavors/${id}/test`}
      />
    </div>
  );
}
