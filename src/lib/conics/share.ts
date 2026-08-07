import { trs } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";

export type SharePayload = { path: string; params: Record<string, string> };

function newCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function cleanParams(params: Record<string, string | undefined>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && String(v).trim() !== "") out[k] = String(v);
  }
  return out;
}

export async function createShareLink(
  path: string,
  params: Record<string, string | undefined>,
): Promise<string> {
  const payload = cleanParams(params);
  let lastError = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const id = newCode();
    const { error } = await supabase.from("shares").insert({ id, path, params: payload });
    if (!error) return `${window.location.origin}/share?id=${id}`;
    lastError = error.message;
    if (!error.message.toLowerCase().includes("duplicate")) break;
  }
  throw new Error(lastError || trs("শেয়ার লিংক তৈরি করা যায়নি"));
}

export async function loadShare(id: string): Promise<SharePayload | null> {
  const { data, error } = await supabase
    .from("shares")
    .select("path, params")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  const raw = (data.params ?? {}) as Record<string, unknown>;
  const params: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string" || typeof v === "number") params[k] = String(v);
  }
  return { path: data.path, params };
}

export function passthroughSearch(raw: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === "string" || typeof v === "number") out[k] = String(v);
  }
  return out;
}

export async function copyShareLink(path: string, params: Record<string, string | undefined>) {
  const url = await createShareLink(path, params);
  try {
    await navigator.clipboard.writeText(url);
    return { url, copied: true };
  } catch {
    return { url, copied: false };
  }
}
