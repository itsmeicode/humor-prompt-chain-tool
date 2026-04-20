import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const navItems: { href: string; label: string }[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/flavors", label: "Humor Flavors" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    redirect(
      `/access-denied?reason=profile_error&code=${encodeURIComponent(
        profileError.code ?? ""
      )}`
    );
  }

  if (!profile) {
    redirect("/access-denied?reason=no_profile_row");
  }

  if (!profile.is_superadmin && !profile.is_matrix_admin) {
    redirect("/access-denied?reason=not_admin");
  }

  return (
    <div className="flex min-h-screen min-w-0 flex-col md:flex-row md:items-stretch">
      <aside className="relative z-20 flex min-h-screen shrink-0 flex-col overflow-y-auto border-b border-zinc-800 bg-zinc-950 px-5 py-8 text-zinc-100 md:sticky md:top-0 md:w-60 md:border-b-0 md:border-r">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
          Prompt Chain Tool
        </p>
        <p className="mt-1 text-lg font-semibold text-white">Admin</p>
        <nav className="mt-6 flex flex-col gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-10">
          <p className="mb-2 truncate text-xs text-zinc-500">{user.email}</p>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="w-full rounded-lg border border-zinc-500 bg-zinc-800/70 px-3 py-2 text-sm font-medium text-zinc-50 shadow-sm transition-colors hover:border-zinc-400 hover:bg-zinc-700 hover:text-white"
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-h-screen min-w-0 flex-1 bg-zinc-100 dark:bg-zinc-950">
        {children}
      </div>
    </div>
  );
}
