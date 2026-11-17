import type { Application } from '../types/application';
import type { Scholarship } from '../types/scholarship';

export const getScholarshipPeriodPrefix = (scholarship: Scholarship): string => {
  const academicYear = String(scholarship.academicYear || '');
  const termDigits = String(scholarship.term || '').replace(/\D/g, '');
  const term = termDigits ? termDigits.padStart(2, '0').slice(-2) : '01';

  return `${academicYear.slice(-2)}${term}`;
};

export const applicationMatchesScholarshipPeriod = (
  application: Application,
  scholarship: Scholarship
): boolean => applicationMatchesPeriod(application, getScholarshipPeriodPrefix(scholarship));

export const applicationMatchesPeriod = (
  application: Application,
  periodPrefix: string
): boolean => {
  if (!/^\d{8}$/.test(application.trackingId)) return true;
  return application.trackingId.startsWith(periodPrefix);
};
