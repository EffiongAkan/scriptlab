
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export async function fetchAICredits() {
  const { data } = await supabase.auth.getUser();
  const userId = data?.user?.id;
  if (!userId) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("ai_credits")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) throw new Error(profileError.message);
  return profile?.ai_credits ?? 0;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  action: string;
  description: string | null;
  created_at: string;
}

export async function fetchCreditHistory(): Promise<CreditTransaction[]> {
  const { data } = await supabase.auth.getUser();
  const userId = data?.user?.id;
  if (!userId) return [];

  const { data: transactions, error } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Error fetching credit history:", error);
    return [];
  }
  return (transactions as CreditTransaction[]) || [];
}

/**
 * Deduct AI credits from the current user's profile.
 * Records transaction in credit_transactions.
 * Returns { success, remainingCredits }
 */
export async function deductAICredits(
  amount: number,
  action: string,
  description?: string
): Promise<{ success: boolean; remainingCredits: number; message?: string }> {
  const { data } = await supabase.auth.getUser();
  const userId = data?.user?.id;
  if (!userId) return { success: false, remainingCredits: 0, message: "Not authenticated" };

  // Get current credits
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_credits")
    .eq("id", userId)
    .maybeSingle();

  const currentCredits = profile?.ai_credits ?? 0;

  if (currentCredits < amount) {
    return {
      success: false,
      remainingCredits: currentCredits,
      message: `Insufficient credits. You have ${currentCredits} credits, but this action requires ${amount}.`,
    };
  }

  const newCredits = currentCredits - amount;

  // Deduct credits from profile
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ ai_credits: newCredits })
    .eq("id", userId);

  if (updateError) {
    return { success: false, remainingCredits: currentCredits, message: updateError.message };
  }

  // Log transaction
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: -amount,
    action,
    description: description || action,
  });

  return { success: true, remainingCredits: newCredits };
}

/**
 * Add credits (for admin or purchase).
 */
export async function addAICredits(
  userId: string,
  amount: number,
  action: string = "purchase",
  description?: string
): Promise<boolean> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_credits")
    .eq("id", userId)
    .maybeSingle();

  const currentCredits = profile?.ai_credits ?? 0;
  const { error } = await supabase
    .from("profiles")
    .update({ ai_credits: currentCredits + amount })
    .eq("id", userId);

  if (!error) {
    await supabase.from("credit_transactions").insert({
      user_id: userId,
      amount: amount,
      action,
      description: description || `Added ${amount} credits`,
    });
  }

  return !error;
}

/**
 * React Query hook to get current user's AI credits.
 */
export function useAICredits() {
  return useQuery({
    queryKey: ["ai_credits"],
    queryFn: fetchAICredits,
    refetchInterval: 30000,
    staleTime: 30000,
  });
}

/**
 * Hook to get credit transaction history.
 */
export function useCreditHistory() {
  return useQuery({
    queryKey: ["credit_history"],
    queryFn: fetchCreditHistory,
    staleTime: 30000,
  });
}
