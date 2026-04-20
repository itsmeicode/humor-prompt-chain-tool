"use client";

import Link from "next/link";
import { type ReactNode, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-md bg-zinc-200 px-1.5 py-0.5 font-mono text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
      {children}
    </code>
  );
}

function AccessDeniedReason() {
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const code = searchParams.get("code");

  let detail: ReactNode;
  switch (reason) {
    case "profile_error":
      detail = (
        <>
          The app could not read your row in <Code>profiles</Code> (PostgREST
          error). This usually means Row Level Security is blocking{" "}
          <Code>select</Code> for your user. In Supabase, allow authenticated
          users to read their own profile, e.g. <Code>(auth.uid() = id)</Code>.
          Error code: <Code>{code || "unknown"}</Code>.
        </>
      );
      break;
    case "no_profile_row":
      detail = (
        <>
          There is no <Code>profiles</Code> row whose <Code>id</Code> matches
          your signed-in user id. Create a profile row for{" "}
          <Code>auth.users.id</Code>, or fix a mismatch if you edited the wrong
          row.
        </>
      );
      break;
    case "not_admin":
      detail = (
        <>
          Neither <Code>profiles.is_superadmin</Code> nor{" "}
          <Code>profiles.is_matrix_admin</Code> is <Code>true</Code> for your
          account, so you cannot use this tool.
        </>
      );
      break;
    default:
      detail = (
        <>
          You do not have access. If you expect access, confirm{" "}
          <Code>profiles.is_superadmin</Code> or{" "}
          <Code>profiles.is_matrix_admin</Code> is <Code>true</Code> for your
          account, and that RLS lets you read your own profile row.
        </>
      );
  }

  return (
    <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
      {detail}
    </p>
  );
}

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-amber-50 px-4 dark:bg-amber-950/30">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Access Denied
        </h1>
        <Suspense
          fallback={<p className="mt-3 text-sm text-zinc-500">Loading…</p>}
        >
          <AccessDeniedReason />
        </Suspense>
        <form action="/auth/signout" method="post" className="mt-6">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Sign out
          </button>
        </form>
        <Link
          href="/login"
          className="mt-4 inline-block text-sm text-zinc-600 underline dark:text-zinc-400"
        >
          Back to login
        </Link>
      </div>
    </main>
  );
}
