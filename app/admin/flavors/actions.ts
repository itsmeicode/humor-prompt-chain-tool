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
