import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

type CaptionRow = {
  id: string;
  content: string | null;
  like_count: number;
  is_featured: boolean;
  is_public: boolean;
  created_datetime_utc: string;
  image_id: string;
  images?: {
    url: string | null;
    image_description: string | null;
  } | null;
};

export default async function FlavorCaptionsPage({
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
  const {
    data: captions,
    count,
    error: captionsErr,
  } = await supabase
    .from("captions")
    .select(
      "id, content, like_count, is_featured, is_public, created_datetime_utc, image_id, images(url, image_description)",
      { count: "exact" }
    )
    .eq("humor_flavor_id", id)
    .order("created_datetime_utc", { ascending: false })
    .range(from, to);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (page > totalPages && total > 0) {
    redirect(`/admin/flavors/${id}/captions?p=${totalPages}`);
  }

  const rows = (captions ?? []) as unknown as CaptionRow[];
  const grouped = groupByImage(rows);

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
          Captions for {flavorRes.data.slug}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {total} caption{total === 1 ? "" : "s"} produced by this flavor.
        </p>
      </header>

      {captionsErr && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {captionsErr.message}
        </p>
      )}

      {!captionsErr && rows.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No captions yet. Run this flavor on{" "}
          <Link
            href={`/admin/flavors/${id}/test`}
            className="font-medium text-zinc-700 underline dark:text-zinc-300"
          >
            the test page
          </Link>{" "}
          to generate some.
        </p>
      )}

      {!captionsErr && grouped.length > 0 && (
        <div className="flex flex-col gap-6">
          {grouped.map((group) => (
            <article
              key={group.imageId}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="shrink-0">
                  {group.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={group.imageUrl}
                      alt={group.imageDescription ?? "image"}
                      className="h-32 w-32 rounded-lg border border-zinc-200 object-cover dark:border-zinc-800"
                    />
                  ) : (
                    <div className="flex h-32 w-32 items-center justify-center rounded-lg border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700">
                      no image
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Image{" "}
                    <span className="font-mono">
                      {group.imageId.slice(0, 8)}…
                    </span>
                    {group.imageDescription && (
                      <> · {group.imageDescription}</>
                    )}
                  </p>
                  <ul className="mt-2 flex flex-col gap-1.5">
                    {group.captions.map((c) => (
                      <li
                        key={c.id}
                        className="rounded-lg bg-zinc-50 px-3 py-2 text-sm text-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                      >
                        <p>
                          {c.content ?? (
                            <span className="italic text-zinc-500">
                              (empty)
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-[10px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          {new Date(c.created_datetime_utc).toLocaleString()}
                          {c.like_count > 0 && (
                            <> · ♥ {c.like_count}</>
                          )}
                          {c.is_featured && <> · featured</>}
                          {c.is_public ? <> · public</> : <> · private</>}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link
                href={`/admin/flavors/${id}/captions?p=${page - 1}`}
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
                href={`/admin/flavors/${id}/captions?p=${page + 1}`}
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
      )}
    </div>
  );
}

type Group = {
  imageId: string;
  imageUrl: string | null;
  imageDescription: string | null;
  captions: CaptionRow[];
};

function groupByImage(rows: CaptionRow[]): Group[] {
  const map = new Map<string, Group>();
  for (const row of rows) {
    const existing = map.get(row.image_id);
    if (existing) {
      existing.captions.push(row);
    } else {
      map.set(row.image_id, {
        imageId: row.image_id,
        imageUrl: row.images?.url ?? null,
        imageDescription: row.images?.image_description ?? null,
        captions: [row],
      });
    }
  }
  return Array.from(map.values());
}
