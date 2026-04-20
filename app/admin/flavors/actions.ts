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
  return supabase;
}

export async function createFlavor(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Name is required" };

  const supabase = await requireAdmin();
  const { error } = await supabase.from("humor_flavors").insert({ name });
  if (error) return { error: error.message };

  revalidatePath("/admin/flavors");
  return { error: null };
}

export async function renameFlavor(formData: FormData) {
  const id = formData.get("id");
  const name = String(formData.get("name") ?? "").trim();
  if (id == null || id === "") return { error: "Missing id" };
  if (!name) return { error: "Name is required" };

  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("humor_flavors")
    .update({ name })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/flavors");
  return { error: null };
}

export async function deleteFlavor(formData: FormData) {
  const id = formData.get("id");
  if (id == null || id === "") return { error: "Missing id" };

  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("humor_flavors")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/flavors");
  return { error: null };
}
