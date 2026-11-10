export const getCurrentAcademicYear = (date = new Date()): string =>
  String(date.getFullYear() + 543);
