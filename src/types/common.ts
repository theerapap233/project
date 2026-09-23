export interface Announcement {
  id: string;
  title: string;
  date: string;
  tag: string;
  tagType: 'primary' | 'warning' | 'success';
  summary: string;
  linkText: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface DownloadDoc {
  id: string;
  title: string;
  desc: string;
  size: string;
  type: string;
}

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface EligibilityQuery {
  year: string;
  gpax: number;
  income: number;
  volunteerHours: number;
}

export interface SiteSettings {
  academicYear: string;
  semester: string;
  heroTitle: string;
  heroSubtitle: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  tickerText: string;
  facebookUrl?: string;
}

