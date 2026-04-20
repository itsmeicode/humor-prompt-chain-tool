import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminOverviewPage() {
  return (
    <div className="w-full min-w-0 max-w-full p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">
          A humor flavor is an ordered chain of prompt steps that turns an
          image into captions. Use this tool to build, edit, and test those
          flavors.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/flavors"
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Manage
          </p>
          <p className="mt-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Humor Flavors
          </p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Create, edit, reorder steps, and test against image sets.
          </p>
        </Link>
      </section>
    </div>
  );
}
