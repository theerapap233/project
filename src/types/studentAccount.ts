import type { Address } from './application';

export interface StudentAccount {
  id?: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  faculty: string;
  major: string;
  year: string;
  gpax?: number;
  passwordHash: string;
  salt: string;
  avatarUrl?: string | null;
  /** ข้อมูลส่วนตัวเพิ่มเติมที่เคยถามในใบสมัคร — ย้ายมาเก็บในบัญชีนักศึกษาแทน */
  personalInfo?: StudentPersonalInfo;
  createdAt: string;
  lastLoginAt?: string | null;
  loginCount?: number;
}

export interface StudentRegistrationData {
  studentId: string;
  name: string;
  email: string;
  phone: string;
  // ข้อมูลเพิ่มเติม (ไม่บังคับตอนลงทะเบียน — กรอกภายหลังได้ที่เมนูโปรไฟล์)
  faculty?: string;
  major?: string;
  year?: string;
  gpax?: number;
  password: string;
}

/**
 * ข้อมูลส่วนตัวเชิงลึกของนักศึกษา (เดิมอยู่ในแบบฟอร์มสมัครทุนหลายขั้น)
 * เก็บในบัญชีนักศึกษา และถูกดึงไปเติมในใบสมัครอัตโนมัติ
 */
export interface StudentPersonalInfo {
  nickname: string;

  // ที่อยู่
  address: Address;
  isIdCardAddress: boolean;
  idCardAddress: Address;

  // ครอบครัว
  fatherName: string;
  fatherPhone: string;
  fatherJob: string;
  fatherIncome: number | string;
  fatherAlive: 'alive' | 'deceased';

  motherName: string;
  motherPhone: string;
  motherJob: string;
  motherIncome: number | string;
  motherAlive: 'alive' | 'deceased';

  parentsRelation: 'together' | 'divorced' | 'other';
  familyIncome: number | string;
  siblings: number | string;

  // แหล่งเงินทุนและสินเชื่อ
  sponsor: string[];
  sponsorOther: string;
  loanStatus: 'none' | 'กยศ' | 'กรอ';
  loanAmount: number | string;

  // งานพิเศษ
  hasPartTimeJob: boolean;
  partTimeJobLocation: string;
  partTimeJobIncome: number | string;

  // กิจกรรม
  hasActivities: boolean;
  activities: string;
  activityRole: string;
}

export type StudentAuthAction = 'login' | 'logout' | 'register' | 'password_change';

export interface StudentLoginLogInput {
  studentId: string;
  studentName?: string;
  accountId?: string | null;
  action?: StudentAuthAction;
  success: boolean;
  failureReason?: string;
  userAgent?: string;
}
