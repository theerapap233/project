import { ApplicationStatus } from '../types/application';

/** ข้อความและสีของสถานะใบสมัคร ใช้ร่วมกันทั้งหน้าต่างใบสมัครของฉัน แถบสรุป และการ์ดทุน */
export const STATUS_META: Record<ApplicationStatus, { label: string; short: string; color: string; bg: string; border: string }> = {
  submitted: { label: 'อยู่ระหว่างพิจารณา', short: 'รอพิจารณา', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  approved: { label: 'อนุมัติทุนแล้ว', short: 'อนุมัติแล้ว', color: '#047857', bg: '#ecfdf5', border: '#a7f3d0' },
  rejected: { label: 'ไม่ผ่านการพิจารณา', short: 'ไม่ผ่าน', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca' }
};
