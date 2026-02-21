
import React from "react";
import { Loader } from "lucide-react";
import { useAICredits } from "@/hooks/useAICredits";

export function AICreditsStatus() {
  const { data: credits, isLoading, error } = useAICredits();

  let statusColor =
    credits === undefined
      ? "bg-gray-100 text-gray-800"
      : credits > 5
      ? "bg-green-100 text-green-800"
      : credits > 0
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800";

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-lg">
      <span className="text-xs font-medium">AI Credits:</span>
      <span
        className={`px-2 py-1 rounded text-xs font-semibold ${statusColor}`}
        title={error ? "Error loading credits" : ""}
      >
        {isLoading ? <Loader className="animate-spin h-3 w-3" /> : credits ?? "--"}
      </span>
      {error && (
        <span className="text-xs text-red-500" title={error.message}>
          (Error)
        </span>
      )}
    </div>
  );
}
