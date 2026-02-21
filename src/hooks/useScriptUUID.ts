
/**
 * Hook for validating and generating script UUIDs
 */
import { v4 as uuidv4 } from 'uuid';

/**
 * Validates if a string is a valid UUID
 * @param id - The string to validate
 * @returns boolean indicating if the string is a valid UUID
 */
export const useScriptUUID = () => {
  // Check if the script ID is a valid UUID
  const isValidUuid = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return id && uuidRegex.test(id);
  };

  // Generate a new valid UUID
  const generateUuid = () => {
    return uuidv4();
  };

  return {
    isValidUuid,
    generateUuid
  };
};
