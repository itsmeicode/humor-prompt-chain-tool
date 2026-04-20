"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin(flavorId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/flavors/${flavorId}`);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("is_superadmin, is_matrix_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    redirect(
      `/access-denied?reason=profile_error&code=${encodeURIComponent(
        error.code ?? ""
      )}`
    );
  }
  if (!profile) redirect("/access-denied?reason=no_profile_row");
  if (!profile.is_superadmin && !profile.is_matrix_admin) {
    redirect("/access-denied?reason=not_admin");
  }
  return { supabase, userId: user.id };
}

function readNumber(fd: FormData, key: string): number | null {
  const raw = fd.get(key);
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function readString(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function readNullableString(fd: FormData, key: string): string | null {
  const v = readString(fd, key);
  return v === "" ? null : v;
}

type StepBody = {
  description: string | null;
  humor_flavor_step_type_id: number;
  llm_input_type_id: number;
  llm_output_type_id: number;
  llm_model_id: number;
  llm_temperature: number | null;
  llm_system_prompt: string | null;
  llm_user_prompt: string | null;
};

function buildStepBody(fd: FormData): StepBody | { error: string } {
  const stepTypeId = readNumber(fd, "humor_flavor_step_type_id");
  const inputTypeId = readNumber(fd, "llm_input_type_id");
  const outputTypeId = readNumber(fd, "llm_output_type_id");
  const modelId = readNumber(fd, "llm_model_id");
  if (stepTypeId == null) return { error: "Step type is required" };
  if (inputTypeId == null) return { error: "Input type is required" };
  if (outputTypeId == null) return { error: "Output type is required" };
  if (modelId == null) return { error: "Model is required" };

  const systemPrompt = readString(fd, "llm_system_prompt");
  const userPrompt = readString(fd, "llm_user_prompt");
  if (!systemPrompt) return { error: "System prompt is required" };
  if (!userPrompt) return { error: "User prompt is required" };

  return {
    description: readNullableString(fd, "description"),
    humor_flavor_step_type_id: stepTypeId,
    llm_input_type_id: inputTypeId,
    llm_output_type_id: outputTypeId,
    llm_model_id: modelId,
    llm_temperature: readNumber(fd, "llm_temperature"),
    llm_system_prompt: systemPrompt,
    llm_user_prompt: userPrompt,
  };
}

export async function createStep(formData: FormData) {
  const flavorId = String(formData.get("flavor_id") ?? "");
  if (!flavorId) return { error: "Missing flavor_id" };

  const body = buildStepBody(formData);
  if ("error" in body) return body;

  const { supabase, userId } = await requireAdmin(flavorId);

  const { data: existing, error: maxErr } = await supabase
    .from("humor_flavor_steps")
    .select("order_by")
    .eq("humor_flavor_id", flavorId)
    .order("order_by", { ascending: false, nullsFirst: false })
    .limit(1);
  if (maxErr) return { error: maxErr.message };

  const nextOrder =
    existing && existing.length > 0 && typeof existing[0].order_by === "number"
      ? existing[0].order_by + 1
      : 1;

  const now = new Date().toISOString();
  const { error } = await supabase.from("humor_flavor_steps").insert({
    ...body,
    humor_flavor_id: Number(flavorId),
    order_by: nextOrder,
    created_by_user_id: userId,
    modified_by_user_id: userId,
    created_datetime_utc: now,
    modified_datetime_utc: now,
  });
  if (error) return { error: error.message };

  revalidatePath(`/admin/flavors/${flavorId}`);
  return { error: null };
}

export async function updateStep(formData: FormData) {
  const flavorId = String(formData.get("flavor_id") ?? "");
  const id = formData.get("id");
  if (!flavorId) return { error: "Missing flavor_id" };
  if (id == null || id === "") return { error: "Missing id" };

  const body = buildStepBody(formData);
  if ("error" in body) return body;

  const { supabase, userId } = await requireAdmin(flavorId);
  const { error } = await supabase
    .from("humor_flavor_steps")
    .update({
      ...body,
      modified_by_user_id: userId,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/flavors/${flavorId}`);
  return { error: null };
}

export async function deleteStep(formData: FormData) {
  const flavorId = String(formData.get("flavor_id") ?? "");
  const id = formData.get("id");
  if (!flavorId) return { error: "Missing flavor_id" };
  if (id == null || id === "") return { error: "Missing id" };

  const { supabase } = await requireAdmin(flavorId);
  const { error } = await supabase
    .from("humor_flavor_steps")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath(`/admin/flavors/${flavorId}`);
  return { error: null };
}

export async function reorderSteps(
  flavorId: string,
  orderedIds: (string | number)[]
) {
  if (!flavorId) return { error: "Missing flavor_id" };
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return { error: "No steps to reorder" };
  }

  const { supabase, userId } = await requireAdmin(flavorId);
  const now = new Date().toISOString();

  const updates = await Promise.all(
    orderedIds.map((id, idx) =>
      supabase
        .from("humor_flavor_steps")
        .update({
          order_by: idx + 1,
          modified_by_user_id: userId,
          modified_datetime_utc: now,
        })
        .eq("id", id)
        .eq("humor_flavor_id", flavorId)
    )
  );
  const firstError = updates.find((r) => r.error)?.error;
  if (firstError) return { error: firstError.message };

  revalidatePath(`/admin/flavors/${flavorId}`);
  return { error: null };
}
