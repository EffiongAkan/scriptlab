
import { supabase } from "@/integrations/supabase/client";

// Save a synopsis for a user
export async function saveSynopsis({ title, content, userId }: { title: string, content: string, userId: string }) {
  const { data, error } = await supabase
    .from("synopses")
    .insert([{ title, content, user_id: userId }])
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

// Fetch all synopses for a user
export async function fetchUserSynopses(userId: string) {
  const { data, error } = await supabase
    .from("synopses")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data;
}
