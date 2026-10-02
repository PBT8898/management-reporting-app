import "server-only";
import { createClient } from "@supabase/supabase-js";
export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Database environment is missing. Pull this project's Vercel environment before running the app.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export async function rows<T>(table: string, order = "created_at"): Promise<T[]> {
  const { data, error } = await db().from(table).select("*").order(order).limit(10000);
  if (error) throw new Error(`Unable to load ${table}: ${error.message}`);
  return data as T[];
}
export async function save(table: string, values: Record<string, unknown>, id?: string) {
  const query = id ? db().from(table).update(values).eq("id", id) : db().from(table).insert(values);
  const { data, error } = await query.select().single();
  if (error) throw new Error(error.code === "23505" ? "This record already exists. Select or edit the existing one." : error.message);
  return data;
}
export async function remove(table: string, id: string) {
  const { error } = await db().from(table).delete().eq("id", id);
  if (error) throw new Error(error.message);
}
