
import { isValidUuid } from './validationUtils';

export const validateInvitation = (scriptId: string, email: string) => {
  // Validate script ID
  if (!scriptId || !isValidUuid(scriptId)) {
    return {
      isValid: false,
      error: "Invalid script ID"
    };
  }
  
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: "Invalid email address"
    };
  }

  return {
    isValid: true,
    error: null
  };
};
