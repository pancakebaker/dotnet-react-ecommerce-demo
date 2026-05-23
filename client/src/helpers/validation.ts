export const phonePattern = String.raw`\+?[0-9][0-9\s\(\)\.\-]{6,49}`;
export const phonePatternTitle = 'Use digits, spaces, parentheses, dashes, periods, and an optional leading plus sign.';
export const phonePlaceholder = '+1 555-0199';
export const phoneValidationMessage = 'Enter a mobile number like +1 555-0199.';
export const emailPlaceholder = 'emil@example.com';
export const emailValidationMessage = 'Enter an email address with a full domain, like emil@example.com.';

const phoneRegex = new RegExp(`^(?:${phonePattern})$`);
const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isValidPhone(value: string | null | undefined) {
  const clean = value?.trim() ?? '';
  return clean.length === 0 || phoneRegex.test(clean);
}

export function isValidEmail(value: string | null | undefined) {
  const clean = value?.trim() ?? '';
  return clean.length > 0 && clean.length <= 255 && emailRegex.test(clean);
}
