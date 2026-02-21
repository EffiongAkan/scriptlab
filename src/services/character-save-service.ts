
import { supabase } from "@/integrations/supabase/client";

export async function saveCharacter({
  name, description, background, traits, userId,
}: {
  name: string; description?: string; background?: string; traits?: string[]; userId: string;
}) {
  const { data, error } = await supabase
    .from("saved_characters")
    .insert([{ name, description, background, traits, user_id: userId }])
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchUserSavedCharacters(userId: string) {
  const { data, error } = await supabase
    .from("saved_characters")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
