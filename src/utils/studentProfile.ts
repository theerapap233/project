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

/**
 * คำนวณชั้นปีนักศึกษา (เช่น 'ปี 1', 'ปี 2', 'ปี 3', 'ปี 4') อัตโนมัติตามเวลาจริง
 * โดยเปรียบเทียบกับรหัสนักศึกษา 2 ตัวแรก (ปี พ.ศ. ที่เข้าศึกษา)
 * 
 * - รหัสนักศึกษา มจพ. ขึ้นต้นด้วยเลข 2 หลักของปี พ.ศ. เช่น '6604062610099' => 2566
 * - ภาคการศึกษาที่ 1 ของมหาวิทยาลัยไทยเริ่มประมาณเดือนมิถุนายน
 *   - ถ้าเดือนปัจจุบัน >= 6 (มิ.ย. - ธ.ค.) => ปีการศึกษาปัจจุบัน = พ.ศ. ปัจจุบัน
 *   - ถ้าเดือนปัจจุบัน < 6 (ม.ค. - พ.ค.) => ปีการศึกษาปัจจุบัน = พ.ศ. ปัจจุบัน - 1
 */
export const calculateStudentYear = (
  studentId?: string | null,
  fallbackYear?: string | null
): string => {
  if (!studentId) return fallbackYear || 'ปี 1';

  // ดึงเฉพาะตัวเลขจากรหัสนักศึกษา (รองรับ 's6604062610099' หรือ '66-040626-1009-9')
  const digits = String(studentId).replace(/\D/g, '');
  if (digits.length < 2) {
    return fallbackYear || 'ปี 1';
  }

  const entryYearShort = parseInt(digits.slice(0, 2), 10);
  if (isNaN(entryYearShort)) {
    return fallbackYear || 'ปี 1';
  }

  // แปลงเป็นปี พ.ศ. 4 หลัก (เช่น 66 -> 2566, หากต่ำกว่า 50 เป็น 26xx เพื่อรองรับปีข้างหน้า)
  const entryYearBE = entryYearShort < 50 ? 2600 + entryYearShort : 2500 + entryYearShort;

  const now = new Date();
  const currentYearBE = now.getFullYear() + 543;
  const currentMonth = now.getMonth() + 1; // 1 - 12

  // ปีการศึกษา (Academic Year) ตามปฏิทินการศึกษา
  const currentAcademicYearBE = currentMonth >= 6 ? currentYearBE : currentYearBE - 1;

  const diff = currentAcademicYearBE - entryYearBE;
  const calculatedYearNumber = diff + 1;

  if (calculatedYearNumber <= 1) {
    return 'ปี 1';
  } else if (calculatedYearNumber <= 6) {
    return `ปี ${calculatedYearNumber}`;
  } else {
    return 'ปี 4+';
  }
};

/**
 * สาขาวิชาของภาควิชาคณิตศาสตร์ (เฉพาะ MA และ MC โดยมีโครงการปกติและสมทบพิเศษ)
 */
export const DEPARTMENT_MAJOR_OPTIONS = [
  'วท.บ. คณิตศาสตร์ประยุกต์ (MA) - โครงการปกติ',
  'วท.บ. คณิตศาสตร์ประยุกต์ (MA) - โครงการสมทบพิเศษ',
  'วท.บ. คณิตศาสตร์เชิงคอมพิวเตอร์ (MC) - โครงการปกติ',
  'วท.บ. คณิตศาสตร์เชิงคอมพิวเตอร์ (MC) - โครงการสมทบพิเศษ'
] as const;

export type DepartmentMajor = (typeof DEPARTMENT_MAJOR_OPTIONS)[number];

/**
 * ปรับชื่อสาขาวิชาเดิมให้ตรงกับตัวเลือกมาตรฐาน MA / MC
 */
export const normalizeMajorName = (major?: string | null): string => {
  if (!major) return DEPARTMENT_MAJOR_OPTIONS[0];
  const text = major.trim();
  if ((DEPARTMENT_MAJOR_OPTIONS as readonly string[]).includes(text)) {
    return text;
  }
  const isSpecial = text.includes('สมทบ');
  if (text.includes('MC') || text.includes('คอมพิวเตอร์') || text.includes('เชิงคำนวณ')) {
    return isSpecial ? DEPARTMENT_MAJOR_OPTIONS[3] : DEPARTMENT_MAJOR_OPTIONS[2];
  }
  return isSpecial ? DEPARTMENT_MAJOR_OPTIONS[1] : DEPARTMENT_MAJOR_OPTIONS[0];
};


