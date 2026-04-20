import { createClient } from "@/lib/supabase/server";
import { CreateFlavorForm } from "./_components/CreateFlavorForm";
import { FlavorRow, type FlavorRowData } from "./_components/FlavorRow";

export const dynamic = "force-dynamic";

export default async function AdminFlavorsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("humor_flavors")
    .select("id, name, created_datetime_utc")
    .order("created_datetime_utc", { ascending: false, nullsFirst: false })
    .order("id", { ascending: false });

  const flavors = (data ?? []) as FlavorRowData[];

  return (
    <div className="w-full min-w-0 max-w-4xl p-6 md:p-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Humor Flavors
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          A flavor is an ordered chain of prompt steps that turns an image into
          captions. Click a flavor to manage its steps.
        </p>
      </header>

      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <CreateFlavorForm />
      </section>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {error.message}
        </p>
      )}

      {!error && flavors.length === 0 && (
        <p className="rounded-lg border border-dashed border-zinc-300 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No flavors yet. Create one above to get started.
        </p>
      )}

      {!error && flavors.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full">
            <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {flavors.map((f) => (
                <FlavorRow key={String(f.id)} flavor={f} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
