import { supabase } from "./supabaseClient.js";

function requireSupabase() {
  if (!supabase) throw new Error("Supabase nao configurado.");
  return supabase;
}

export async function fetchPromotionalCodes() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("promotional_codes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function createPromotionalCode(code) {
  const client = requireSupabase();
  const { data: authData } = await client.auth.getUser();
  const { data, error } = await client
    .from("promotional_codes")
    .insert({
      ...code,
      code: code.code.trim().toUpperCase(),
      created_by: authData.user?.id,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updatePromotionalCode(id, changes) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("promotional_codes")
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deletePromotionalCode(id) {
  const client = requireSupabase();
  const { error } = await client.from("promotional_codes").delete().eq("id", id);
  if (error) throw error;
}
