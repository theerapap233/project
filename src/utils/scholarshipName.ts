export const stripScholarshipCode = (name: string): string =>
  name.replace(/\s*\(MATH-[A-Z0-9-]+\)\s*$/i, '').trim();
