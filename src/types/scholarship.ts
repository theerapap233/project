export type ScholarshipCategory = 
  | 'all'
  | 'academic'
  | 'need'
  | 'work'
  | 'alumni'
  | 'activity';

export type ScholarshipStatus = 'open' | 'closing_soon' | 'closed';

export interface Scholarship {
  id: string;
  code: string;
  title: string;
  category: Exclude<ScholarshipCategory, 'all'>;
  categoryName: string;
  badgeColor: 'gold' | 'blue' | 'purple' | 'emerald' | 'orange';
  amount: string;
  totalSlots: number;
  remainingSlots: number;
  academicYear: string;
  term: string;
  deadline: string;
  status: ScholarshipStatus;
  minGPAX: number;
  maxFamilyIncome?: number;
  minVolunteerHours?: number;
  targetYears: string[];
  targetMajors: string[];
  description: string;
  requirements: string[];
  documents: string[];
  fundingSource: string;
}
