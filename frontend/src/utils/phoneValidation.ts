export const ETHIOPIAN_PHONE_REGEX = /^(09\d{8}|07\d{8}|\+?251(9|7)\d{8})$/;

export function validateEthiopianPhone(phone: string): { valid: boolean; error?: string } {
  if (!phone) return { valid: true }; // Allow empty if optional, let required validation handle otherwise
  
  // Remove spaces, dashes, parentheses, and dots
  const cleanPhone = String(phone).replace(/[\s\-\(\)\.]/g, '');
  if (!ETHIOPIAN_PHONE_REGEX.test(cleanPhone)) {
    return {
      valid: false,
      error: 'Phone must be a valid Ethiopian number (e.g., 09..., 07..., or +251...).'
    };
  }
  
  return { valid: true };
}
