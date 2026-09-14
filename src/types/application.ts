export type ApplicationStatus = 
  | 'submitted'
  | 'doc_verified'
  | 'interview_scheduled'
  | 'approved'
  | 'rejected';

export interface Application {
  trackingId: string;
  scholarshipId: string;
  scholarshipName: string;
  studentId: string;
  fullName: string;
  major: string;
  year: string;
  gpax: number;
  familyIncome: number;
  phone: string;
  email: string;
  submissionDate: string;
  status: ApplicationStatus;
  interviewDate: string;
  score: number | null;
  committeeNotes: string;
  documents: string[];
}

export interface ApplicationFormData {
  scholarshipId: string;
  studentId: string;
  fullName: string;
  major: string;
  year: string;
  gpax: number;
  phone: string;
  email: string;
  fatherName: string;
  fatherJob: string;
  motherName: string;
  motherJob: string;
  familyIncome: number;
  siblings: number;
  loanStatus: 'none' | 'กยศ' | 'กรอ';
  volunteerHours: number;
  activities: string;
  reason: string;
  consent: boolean;
}

export interface UploadedFiles {
  doc1: string | null;
  doc2: string | null;
  doc3: string | null;
}
