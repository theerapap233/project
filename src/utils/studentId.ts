/** Normalize student IDs for consistent comparisons. */
export const normalizeStudentId = (id: string | undefined | null): string =>
  (id || '').trim().replace(/^s/i, '').toLowerCase();
