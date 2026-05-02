"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/flavors");

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

export async function createFlavor(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  if (!slug) return { error: "Slug is required" };

  const { supabase, userId } = await requireAdmin();
  const now = new Date().toISOString();
  const { error } = await supabase.from("humor_flavors").insert({
    slug,
    description: descriptionRaw || null,
    created_by_user_id: userId,
    modified_by_user_id: userId,
    created_datetime_utc: now,
    modified_datetime_utc: now,
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/flavors");
  return { error: null };
}

export async function updateFlavor(formData: FormData) {
  const id = formData.get("id");
  const slug = String(formData.get("slug") ?? "").trim();
  const descriptionRaw = String(formData.get("description") ?? "").trim();
  if (id == null || id === "") return { error: "Missing id" };
  if (!slug) return { error: "Slug is required" };

  const { supabase, userId } = await requireAdmin();
  const { error } = await supabase
    .from("humor_flavors")
    .update({
      slug,
      description: descriptionRaw || null,
      modified_by_user_id: userId,
      modified_datetime_utc: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/flavors");
  return { error: null };
}

export async function duplicateFlavor(formData: FormData) {
  const id = formData.get("id");
  const newSlug = String(formData.get("new_slug") ?? "").trim();
  if (id == null || id === "") return { error: "Missing id", newId: null };
  if (!newSlug) return { error: "New slug is required", newId: null };

  const { supabase, userId } = await requireAdmin();
  const now = new Date().toISOString();

  const { data: original, error: fetchErr } = await supabase
    .from("humor_flavors")
    .select("description")
    .eq("id", id)
    .maybeSingle();
  if (fetchErr) return { error: fetchErr.message, newId: null };
  if (!original) return { error: "Original flavor not found", newId: null };

  const { data: newFlavor, error: insertErr } = await supabase
    .from("humor_flavors")
    .insert({
      slug: newSlug,
      description: original.description,
      created_by_user_id: userId,
      modified_by_user_id: userId,
      created_datetime_utc: now,
      modified_datetime_utc: now,
    })
    .select("id")
    .single();
  if (insertErr) {
    if (insertErr.code === "23505") {
      return {
        error: `A flavor with the slug "${newSlug}" already exists. Try a different slug.`,
        newId: null,
        duplicate: true,
      };
    }
    return { error: insertErr.message, newId: null };
  }

  const { data: steps, error: stepsErr } = await supabase
    .from("humor_flavor_steps")
    .select(
      "order_by, description, humor_flavor_step_type_id, llm_input_type_id, llm_output_type_id, llm_model_id, llm_temperature, llm_system_prompt, llm_user_prompt"
    )
    .eq("humor_flavor_id", id)
    .order("order_by", { ascending: true });
  if (stepsErr) {
    return {
      error: `Flavor copied but failed to load steps: ${stepsErr.message}`,
      newId: newFlavor.id,
    };
  }

  if (steps && steps.length > 0) {
    const newSteps = steps.map((s) => ({
      ...s,
      humor_flavor_id: newFlavor.id,
      created_by_user_id: userId,
      modified_by_user_id: userId,
      created_datetime_utc: now,
      modified_datetime_utc: now,
    }));
    const { error: bulkErr } = await supabase
      .from("humor_flavor_steps")
      .insert(newSteps);
    if (bulkErr) {
      return {
        error: `Flavor copied but step copy failed: ${bulkErr.message}`,
        newId: newFlavor.id,
      };
    }
  }

  revalidatePath("/admin/flavors");
  return { error: null, newId: newFlavor.id };
}

export async function deleteFlavor(formData: FormData) {
  const id = formData.get("id");
  if (id == null || id === "") return { error: "Missing id" };

  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("humor_flavors")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/flavors");
  return { error: null };
}
