import { useMemo } from 'react';
import { useScholarship } from '../context/ScholarshipContext';
import { Application } from '../types/application';

/** ตัด prefix "s" และช่องว่างออก เพื่อเทียบรหัสนักศึกษาให้ตรงกันเสมอ */
export const normalizeStudentId = (id: string | undefined | null): string =>
  (id || '').trim().replace(/^s/i, '').toLowerCase();

/**
 * ดึงเฉพาะใบสมัครของนักศึกษาที่ล็อกอินอยู่ (เรียงจากใหม่ไปเก่า)
 * คืนค่า [] ถ้ายังไม่ได้ล็อกอินหรือไม่ใช่นักศึกษา
 */
export const useMyApplications = () => {
  const { applications, currentUser } = useScholarship();
  const isStudent = currentUser?.role === 'student';
  const myId = normalizeStudentId(currentUser?.studentId);

  const myApplications = useMemo<Application[]>(() => {
    if (!isStudent || !myId) return [];
    return applications
      .filter(app => normalizeStudentId(app.studentId) === myId)
      .sort((a, b) => (b.submissionDate || '').localeCompare(a.submissionDate || ''));
  }, [applications, isStudent, myId]);

  const counts = useMemo(() => ({
    total: myApplications.length,
    submitted: myApplications.filter(a => a.status === 'submitted').length,
    approved: myApplications.filter(a => a.status === 'approved').length,
    rejected: myApplications.filter(a => a.status === 'rejected').length
  }), [myApplications]);

  /** หาใบสมัครล่าสุดของทุนนี้ (ใช้แสดงป้ายสถานะบนการ์ดทุน) */
  const findByScholarship = (scholarshipId: string): Application | undefined =>
    myApplications.find(app => app.scholarshipId === scholarshipId);

  return { isStudent, myApplications, counts, findByScholarship };
};
