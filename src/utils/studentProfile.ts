import type { Address } from '../types/application';
import type { StudentPersonalInfo } from '../types/studentAccount';

export const createEmptyAddress = (): Address => ({
  houseNo: '',
  moo: '',
  soi: '',
  road: '',
  subDistrict: '',
  district: '',
  province: '',
  zipCode: ''
});

export const createEmptyPersonalInfo = (): StudentPersonalInfo => ({
  nickname: '',
  address: createEmptyAddress(),
  isIdCardAddress: true,
  idCardAddress: createEmptyAddress(),

  fatherName: '',
  fatherPhone: '',
  fatherJob: '',
  fatherIncome: '',
  fatherAlive: 'alive',

  motherName: '',
  motherPhone: '',
  motherJob: '',
  motherIncome: '',
  motherAlive: 'alive',

  parentsRelation: 'together',
  familyIncome: '',
  siblings: '',

  sponsor: [],
  sponsorOther: '',
  loanStatus: 'none',
  loanAmount: '',

  hasPartTimeJob: false,
  partTimeJobLocation: '',
  partTimeJobIncome: '',

  hasActivities: false,
  activities: '',
  activityRole: ''
});

const normalizeAddress = (value?: Partial<Address> | null): Address => ({
  ...createEmptyAddress(),
  ...(value || {})
});

/**
 * เติมช่องที่ขาดให้ข้อมูลส่วนตัวที่อาจถูกบันทึกไว้ก่อนหน้านี้ (เช่น จาก Supabase หรือ localStorage รุ่นเก่า)
 */
export const normalizePersonalInfo = (
  value?: Partial<StudentPersonalInfo> | null
): StudentPersonalInfo => {
  const base = createEmptyPersonalInfo();
  if (!value) return base;

  return {
    ...base,
    ...value,
    address: normalizeAddress(value.address),
    idCardAddress: normalizeAddress(value.idCardAddress),
    sponsor: Array.isArray(value.sponsor) ? value.sponsor : []
  };
};

/**
 * ตรวจว่ามีข้อมูลส่วนตัวที่กรอกไว้จริงหรือไม่ (ใช้แสดงสถานะความครบถ้วน)
 */
export const hasFilledPersonalInfo = (value?: Partial<StudentPersonalInfo> | null): boolean => {
  if (!value) return false;
  const info = normalizePersonalInfo(value);
  const textValues = [
    info.nickname,
    info.address.houseNo,
    info.address.province,
    info.fatherName,
    info.motherName,
    info.activities,
    info.partTimeJobLocation
  ];
  const numberValues = [info.familyIncome, info.siblings, info.loanAmount, info.fatherIncome, info.motherIncome];
  return (
    textValues.some(text => Boolean(String(text || '').trim())) ||
    numberValues.some(num => String(num || '').trim() !== '') ||
    info.sponsor.length > 0
  );
};
