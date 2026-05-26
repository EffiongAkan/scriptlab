export function sanitizeErrorMessage(error: any): string {
  if (!error) return "An unknown error occurred.";
  
  let message = typeof error === 'string' ? error : (error.message || String(error));
  
  // 1. Catch-all for QuotaExceededError (localStorage full)
  if (message.includes("QuotaExceededError") || message.includes("exceeded the quota") || message.includes("setItem' on 'Storage'")) {
    return "Your browser's local storage is full. Please clear some space to continue.";
  }
  
  // 2. Strip Supabase Project IDs (e.g. sb-jfjppoevmfjykflmntgl-auth-token)
  // The project ID is typically a 20-char lowercase alphanumeric string
  message = message.replace(/sb-[a-z0-9]{20}-auth-token/g, 'sb-[REDACTED]-auth-token');
  message = message.replace(/[a-z0-9]{20}\.supabase\.co/g, '[REDACTED].supabase.co');
  
  // 3. Strip generic API Keys (sk-..., pk_..., etc)
  message = message.replace(/sk-[a-zA-Z0-9]{32,}/g, 'sk-[REDACTED]');
  message = message.replace(/pk_[a-zA-Z0-9]{20,}/g, 'pk-[REDACTED]');
  
  // 4. Strip JWT tokens (basic pattern: eyJ... . eyJ... . ...)
  message = message.replace(/eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED-TOKEN]');

  // 5. Hide completely raw JSON errors that might leak structure if they contain sensitive keys
  if (message.includes('{"') && (message.includes("api_key") || message.includes("secret") || message.includes("token"))) {
      return "A secure connection error occurred. Please try again.";
  }

  return message;
}
