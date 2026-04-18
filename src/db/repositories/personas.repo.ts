import { getSupabase } from "../supabase.js";

export type PersonaRow = {
  id: string;
  name: string;
  description: string;
  system_prompt: string;
  tone: string;
  icon: string;
  is_default: number;
  created_at: string;
};

export async function listPersonas(): Promise<PersonaRow[]> {
  const { data } = await getSupabase().from("personas").select("*")
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });
  return (data ?? []) as PersonaRow[];
}

export async function getPersona(id: string): Promise<PersonaRow | undefined> {
  const { data } = await getSupabase().from("personas").select("*").eq("id", id).single();
  return data as PersonaRow | undefined;
}

export async function getDefaultPersona(): Promise<PersonaRow | undefined> {
  const { data } = await getSupabase().from("personas").select("*").eq("is_default", 1).limit(1).single();
  return data as PersonaRow | undefined;
}

export async function insertPersona(params: {
  id: string; name: string; description: string; systemPrompt: string; tone: string; icon: string;
}): Promise<PersonaRow | undefined> {
  await getSupabase().from("personas").insert({
    id: params.id, name: params.name, description: params.description,
    system_prompt: params.systemPrompt, tone: params.tone, icon: params.icon,
    is_default: 0, created_at: new Date().toISOString(),
  });
  return getPersona(params.id);
}

export async function updatePersona(
  id: string,
  params: Partial<{ name: string; description: string; systemPrompt: string; tone: string; icon: string }>,
): Promise<PersonaRow | undefined> {
  const update: Record<string, unknown> = {};
  if (params.name !== undefined) update.name = params.name;
  if (params.description !== undefined) update.description = params.description;
  if (params.systemPrompt !== undefined) update.system_prompt = params.systemPrompt;
  if (params.tone !== undefined) update.tone = params.tone;
  if (params.icon !== undefined) update.icon = params.icon;
  if (Object.keys(update).length > 0) {
    await getSupabase().from("personas").update(update).eq("id", id);
  }
  return getPersona(id);
}

export async function deletePersona(id: string): Promise<number> {
  const persona = await getPersona(id);
  if (persona?.is_default) return 0;
  const { data } = await getSupabase().from("personas").delete().eq("id", id).select("id");
  return data?.length ?? 0;
}
