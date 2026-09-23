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
  // 1. Student Info
  scholarshipId: string;
  studentId: string;
  fullName: string;
  nickname: string;
  major: string;
  year: string;
  gpax: number;
  phone: string;
  email: string;
  address: string;
  isIdCardAddress: boolean;
  idCardProvince: string;

  // 2. Family Info
  fatherName: string;
  fatherPhone: string;
  fatherJob: string;
  fatherIncome: number;
  fatherAlive: 'alive' | 'deceased';
  
  motherName: string;
  motherPhone: string;
  motherJob: string;
  motherIncome: number;
  motherAlive: 'alive' | 'deceased';
  
  parentsRelation: 'together' | 'divorced' | 'other';
  familyIncome: number; // Keep for backward compatibility/summary
  siblings: number;

  // 3. Sponsors & Loan
  sponsor: string[]; // e.g., ['father', 'mother', 'other']
  sponsorOther: string;
  loanStatus: 'none' | 'กยศ' | 'กรอ';
  loanAmount: number;

  // 4. Job & Activities
  hasPartTimeJob: boolean;
  partTimeJobLocation: string;
  partTimeJobIncome: number;
  
  hasActivities: boolean;
  activities: string; // Used as summary or combined string
  activityRole: string; // Specific role/duty in activity
  volunteerHours: number; // Keep for backward compatibility
  
  // 5. General
  reason: string;
  consent: boolean;
}

export interface UploadedFiles {
  doc1: string | null;
  doc2: string | null;
  doc3: string | null;
}
