/**
 * Header aliases mapping for Excel import
 * Maps system field names to accepted Excel column headers (case-insensitive)
 */
export const HEADER_ALIASES: Record<string, string[]> = {
  fullName: [
    "full name",
    "name",
    "គោត្តនាម-នាម",
    "ឈ្មោះ",
    "នាម",
    "គោត្តនាម និងនាម",
  ],
  gender: ["gender", "sex", "ភេទ"],
  idCard: ["id", "student id", "id card", "អត្តលេខ", "លេខសិស្ស"],
  dateOfBirth: [
    "date of birth",
    "dob",
    "birth date",
    "ថ្ងៃខែឆ្នាំកំណើត",
    "ថ្ងៃកំណើត",
  ],
  fatherName: [
    "father name",
    "father's name",
    "ឈ្មោះឪពុក",
    "ឪពុក",
  ],
  fatherOccupation: [
    "father occupation",
    "father's occupation",
    "មុខរបររបស់ឪពុក",
  ],
  montherName: [
    "mother name",
    "mother's name",
    "ឈ្មោះម្ដាយ",
    "ម្ដាយ",
  ],
  montherOccupation: [
    "mother occupation",
    "mother's occupation",
    "មុខរបររបស់ម្ដាយ",
  ],
  placeOfBirth: [
    "place of birth",
    "birthplace",
    "ទីកន្លែងកំណើត",
  ],
  address: [
    "address",
    "residence",
    "ទីលំនៅ",
    "ទីលំនៅបច្ចុប្បន្ន",
  ],
};

/**
 * Matches an Excel header to a system field name
 * @param excelHeader The header from Excel file
 * @returns The system field name or null if no match
 */
export const matchHeaderToField = (excelHeader: string): string | null => {
  if (!excelHeader) return null;

  const normalizedHeader = excelHeader.trim().toLowerCase();

  for (const [fieldName, aliases] of Object.entries(HEADER_ALIASES)) {
    if (aliases.some((alias) => alias.toLowerCase() === normalizedHeader)) {
      return fieldName;
    }
  }

  return null;
};

/**
 * Validates that Excel headers contain required fields
 * @param headers Excel column headers
 * @param requiredFields Required system field names
 * @returns Object with validation result and any errors
 */
export const validateHeaders = (
  headers: string[],
  requiredFields: string[] = ["fullName"]
): { isValid: boolean; errors: string[]; mappedHeaders: Record<string, string> } => {
  const errors: string[] = [];
  const mappedHeaders: Record<string, string> = {};

  // Map headers to fields
  headers.forEach((header) => {
    const fieldName = matchHeaderToField(header);
    if (fieldName) {
      mappedHeaders[fieldName] = header;
    }
  });

  // Check for required fields
  requiredFields.forEach((field) => {
    if (!mappedHeaders[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    mappedHeaders,
  };
};
