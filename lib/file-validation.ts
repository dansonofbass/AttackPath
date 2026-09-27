export function validatePdf(file: File | undefined): {
  valid: boolean;
  error?: string;
} {
  if (!file)
    return { valid: false, error: "The selected file could not be validated." };
  if (
    !/\.pdf$/i.test(file.name) ||
    (file.type && file.type !== "application/pdf")
  )
    return { valid: false, error: "Only PDF files are supported." };
  if (!file.size) return { valid: false, error: "The selected PDF is empty." };
  if (file.size > 25 * 1024 * 1024)
    return {
      valid: false,
      error: "The selected file exceeds the 25 MB limit.",
    };
  return { valid: true };
}
