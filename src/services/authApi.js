import { supabase } from "./supabaseClient.js";

function requireSupabase() {
  if (!supabase) throw new Error("Supabase nao configurado.");
  return supabase;
}

export function authErrorMessage(error) {
  const message = error?.message?.toLowerCase() || "";

  if (message.includes("supabase nao configurado")) return "Supabase nao configurado.";
  if (message.includes("email signups are disabled")) return "Cadastro por e-mail esta desativado no Supabase Auth.";
  if (message.includes("rate limit") || message.includes("email rate limit")) return "Limite de e-mails do Supabase excedido. Aguarde alguns minutos ou configure SMTP proprio.";
  if (message.includes("already registered") || message.includes("user already registered")) return "Este e-mail ja esta cadastrado. Tente entrar.";
  if (message.includes("password")) return "A senha precisa ter pelo menos 6 caracteres.";
  if (message.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (message.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (message.includes("invalid email")) return "Digite um e-mail valido.";

  return error?.message || "Nao foi possivel concluir agora.";
}

export async function getCurrentSession() {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function watchAuthState(callback) {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

export async function signInCustomer({ email, password }) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUpCustomer({ name, email, phone, document, password }) {
  const client = requireSupabase();
  const profile = {
    full_name: name,
    phone,
    document,
  };

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: profile,
    },
  });

  if (error) throw error;

  if (data.user) {
    await saveCustomerProfile({
      id: data.user.id,
      name,
      email,
      phone,
      document,
    });
  }

  return data;
}

export async function saveCustomerProfile(profile) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("profiles")
    .upsert({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      document: profile.document,
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    console.warn("Perfil nao salvo na tabela profiles.", error);
    return null;
  }

  return data;
}

export async function fetchCustomerProfile(userId) {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) {
    console.warn("Perfil nao encontrado.", error);
    return null;
  }

  return data;
}

export async function fetchProfiles() {
  const client = requireSupabase();
  const { data, error } = await client
    .from("profiles")
    .select("id, name, email, phone, document, role, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateProfileRole(profileId, role) {
  const client = requireSupabase();
  const { data, error } = await client
    .from("profiles")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("id", profileId)
    .select("id, name, email, phone, document, role, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function signOutCustomer() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}
