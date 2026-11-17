interface StudentRegistrationDetails {
  studentId: string;
  name: string;
  email: string;
  phone: string;
}

const STUDENT_NAME_PREFIX =
  /^(?:นาย|นางสาว|นาง|ด\.ช\.|ด\.ญ\.|ดร\.|ผศ\.|รศ\.|ศ\.|Mr\.|Miss|Ms\.|Mrs\.|Dr\.)\s*\S/i;

export const isStudentUniversityEmail = (studentId: string, email: string): boolean =>
  email.trim().toLowerCase() === `s${studentId.trim()}@email.kmutnb.ac.th`;

export const getStudentRegistrationError = (
  data: StudentRegistrationDetails
): string | null => {
  const studentId = data.studentId.trim();
  const name = data.name.trim();
  const email = data.email.trim();
  const phone = data.phone.trim();

  if (!/^\d{13}$/.test(studentId)) {
    return 'กรุณากรอกรหัสนักศึกษาเป็นตัวเลข 13 หลัก';
  }
  if (!STUDENT_NAME_PREFIX.test(name)) {
    return 'กรุณากรอกชื่อ-นามสกุลพร้อมคำนำหน้า เช่น นายสมคิด มุ่งมั่นวิทยา';
  }
  if (!/^0\d{9}$/.test(phone)) {
    return 'กรุณากรอกเบอร์โทรศัพท์ 10 หลัก โดยขึ้นต้นด้วย 0';
  }
  if (!isStudentUniversityEmail(studentId, email)) {
    return `อีเมลต้องอยู่ในรูปแบบ s${studentId}@email.kmutnb.ac.th และตรงกับรหัสนักศึกษา`;
  }

  return null;
};
