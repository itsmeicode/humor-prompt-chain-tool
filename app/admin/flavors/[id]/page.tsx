import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateStepForm } from "./_components/CreateStepForm";
import {
  StepsList,
  type Step,
} from "./_components/StepsList";
import type {
  LookupOptions,
  LookupRow,
  ModelRow,
} from "./_components/StepFormFields";

export const dynamic = "force-dynamic";

export default async function FlavorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [flavorRes, stepsRes, stepTypesRes, inputTypesRes, outputTypesRes, modelsRes] =
    await Promise.all([
      supabase
        .from("humor_flavors")
        .select("id, slug, description")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("humor_flavor_steps")
        .select(
          "id, order_by, description, humor_flavor_step_type_id, llm_input_type_id, llm_output_type_id, llm_model_id, llm_temperature, llm_system_prompt, llm_user_prompt"
        )
        .eq("humor_flavor_id", id)
        .order("order_by", { ascending: true, nullsFirst: false }),
      supabase
        .from("humor_flavor_step_types")
        .select("id, slug, description")
        .order("id", { ascending: true }),
      supabase
        .from("llm_input_types")
        .select("id, slug, description")
        .order("id", { ascending: true }),
      supabase
        .from("llm_output_types")
        .select("id, slug, description")
        .order("id", { ascending: true }),
      supabase
        .from("llm_models")
        .select("id, name, is_temperature_supported")
        .order("name", { ascending: true }),
    ]);

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

  const lookupErrors = [
    stepTypesRes.error,
    inputTypesRes.error,
    outputTypesRes.error,
    modelsRes.error,
  ].filter(Boolean);

  const options: LookupOptions = {
    stepTypes: (stepTypesRes.data ?? []) as LookupRow[],
    inputTypes: (inputTypesRes.data ?? []) as LookupRow[],
    outputTypes: (outputTypesRes.data ?? []) as LookupRow[],
    models: (modelsRes.data ?? []) as ModelRow[],
  };

  const steps = (stepsRes.data ?? []) as Step[];

  return (
    <div className="w-full min-w-0 max-w-3xl p-6 md:p-10">
      <header className="mb-6">
        <Link
          href="/admin/flavors"
          className="text-xs text-zinc-500 hover:underline dark:text-zinc-400"
        >
          ← All flavors
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {flavorRes.data.slug || (
              <span className="italic text-zinc-500">(no slug)</span>
            )}
          </h1>
          <div className="flex gap-2">
            <Link
              href={`/admin/flavors/${flavorRes.data.id}/captions`}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              View captions
            </Link>
            <Link
              href={`/admin/flavors/${flavorRes.data.id}/test`}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Test flavor →
            </Link>
          </div>
        </div>
        {flavorRes.data.description && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {flavorRes.data.description}
          </p>
        )}
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Drag steps to reorder. Steps run top to bottom — each step receives
          the previous step&apos;s output.
        </p>
      </header>

      {lookupErrors.length > 0 && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          Failed to load lookup tables: {lookupErrors[0]!.message}
        </p>
      )}

      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <CreateStepForm flavorId={String(flavorRes.data.id)} options={options} />
      </section>

      {stepsRes.error && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {stepsRes.error.message}
        </p>
      )}

      {!stepsRes.error && (
        <StepsList
          flavorId={String(flavorRes.data.id)}
          steps={steps}
          options={options}
        />
      )}
    </div>
  );
}
