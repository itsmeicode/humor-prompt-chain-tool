import Link from "next/link";

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded-md bg-zinc-200 px-1.5 py-0.5 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
      {children}
    </code>
  );
}

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-amber-50 px-4 dark:bg-amber-950/30">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Access Denied
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          <Code>profiles.is_superadmin</Code> is not <Code>true</Code> for your
          account, so you cannot use this admin area.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Back to login
        </Link>
      </div>
    </main>
  );
}
