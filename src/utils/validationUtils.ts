
/**
 * Validates if the provided string is a valid UUID v4
 */
export const isValidUuid = (id?: string): boolean => {
  if (!id || id === ':scriptId' || id.startsWith(':')) return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};
