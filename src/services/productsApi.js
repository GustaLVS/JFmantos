import { supabase } from "./supabaseClient.js";
import { normalizeCategory } from "../data/products.js";

function fromDatabase(row) {
  const images = Array.isArray(row.images) ? row.images.filter(Boolean) : [];

  return {
    id: row.id,
    name: row.name,
    team: row.team,
    category: normalizeCategory(row.category),
    season: row.season,
    price: Number(row.price),
    type: row.type,
    audience: row.audience || "Masculino",
    sizes: row.sizes || [],
    image: images[0] || row.image_url || "",
    images: images.length ? images : (row.image_url ? [row.image_url] : []),
    colors: row.colors || ["#111111", "#ffffff", "#e43d30"],
    description: row.description,
    featured: row.featured,
    active: row.active,
    custom: true,
    source: "supabase",
  };
}

function toDatabase(product) {
  const images = Array.isArray(product.images) ? product.images.filter(Boolean) : [];

  return {
    name: product.name,
    team: product.team,
    category: normalizeCategory(product.category),
    season: product.season,
    price: product.price,
    type: product.type,
    audience: product.audience || "Masculino",
    sizes: product.sizes,
    image_url: images[0] || product.image || null,
    images,
    description: product.description,
    featured: product.featured || false,
    active: true,
  };
}

export async function fetchProducts() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(fromDatabase);
}

export async function createProduct(product) {
  if (!supabase) throw new Error("Supabase nao configurado.");

  const { data, error } = await supabase
    .from("products")
    .insert(toDatabase(product))
    .select("*")
    .single();

  if (error) throw error;
  return fromDatabase(data);
}

export async function updateProduct(product) {
  if (!supabase) throw new Error("Supabase nao configurado.");

  const { data, error } = await supabase
    .from("products")
    .update(toDatabase(product))
    .eq("id", product.id)
    .select("*")
    .single();

  if (error) throw error;
  return fromDatabase(data);
}

export async function deleteProduct(productId) {
  if (!supabase) throw new Error("Supabase nao configurado.");

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) throw error;
}
