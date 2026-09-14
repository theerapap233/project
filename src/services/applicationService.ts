import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Application, ApplicationStatus, ApplicationFormData, UploadedFiles } from '../types/application';
import { INITIAL_APPLICATIONS } from '../data/initialApplications';

interface DbProgramJoin {
  id: string;
  name: string;
}

interface DbStudentJoin {
  id: string;
  student_code: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  email?: string | null;
  major?: string | null;
  year?: number | null;
}

interface DbScholarshipApplicationRow {
  id: string;
  program_id: string;
  student_id: string;
  gpa: number | null;
  scholarship_type: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  note: string | null;
  reason: string | null;
  form_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  program?: DbProgramJoin | null;
  student?: DbStudentJoin | null;
}

// แปลงสถานะระหว่าง Database กับ Frontend
const mapDbStatusToAppStatus = (dbStatus: string, subStatus?: string): ApplicationStatus => {
  if (dbStatus === 'approved') return 'approved';
  if (dbStatus === 'rejected') return 'rejected';
  if (subStatus && ['submitted', 'doc_verified', 'interview_scheduled'].includes(subStatus)) {
    return subStatus as ApplicationStatus;
  }
  return 'submitted';
};

const mapAppStatusToDbStatus = (status: ApplicationStatus): 'pending' | 'approved' | 'rejected' => {
  if (status === 'approved') return 'approved';
  if (status === 'rejected') return 'rejected';
  return 'pending';
};

const mapRowToApplication = (row: DbScholarshipApplicationRow): Application => {
  const formData = (row.form_data || {}) as Record<string, unknown>;
  const student = row.student;
  const program = row.program;

  const trackingId = (formData.trackingId as string) || `KMUTNB-SCH-${row.id.substring(0, 8).toUpperCase()}`;
  const fullName = student ? `${student.first_name} ${student.last_name}` : ((formData.fullName as string) || 'นักศึกษา มจพ.');
  const studentId = student?.student_code || (formData.studentId as string) || '';
  const major = student?.major || (formData.major as string) || 'ภาควิชาคณิตศาสตร์';
  const year = student?.year ? `ปี ${student.year}` : ((formData.year as string) || 'ปี 1');
  const phone = student?.phone || (formData.phone as string) || '';
  const email = student?.email || (formData.email as string) || '';
  const scholarshipName = program?.name || (formData.scholarshipName as string) || 'ทุนการศึกษา ภาควิชาคณิตศาสตร์';

  const subStatus = formData.subStatus as string | undefined;
  const status = mapDbStatusToAppStatus(row.status, subStatus);

  return {
    trackingId,
    scholarshipId: row.program_id,
    scholarshipName,
    studentId,
    fullName,
    major,
    year,
    gpax: row.gpa ? Number(row.gpa) : ((formData.gpax as number) || 3.0),
    familyIncome: (formData.familyIncome as number) || 0,
    phone,
    email,
    submissionDate: row.created_at ? row.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
    status,
    interviewDate: (formData.interviewDate as string) || 'รอประกาศวันสัมภาษณ์',
    score: (formData.score as number | null) ?? null,
    committeeNotes: row.note || (formData.committeeNotes as string) || '',
    documents: (formData.documents as string[]) || []
  };
};

export const applicationService = {
  /**
   * ดึงรายการใบสมัครทั้งหมด (สำหรับ Admin และสถิติ)
   */
  async getAllApplications(): Promise<{ data: Application[]; source: 'supabase' | 'local' }> {
    if (!isSupabaseConfigured()) {
      return { data: INITIAL_APPLICATIONS, source: 'local' };
    }

    try {
      const { data, error } = await supabase
        .from('scholarship_applications')
        .select(`
          id,
          program_id,
          student_id,
          gpa,
          scholarship_type,
          status,
          note,
          reason,
          form_data,
          created_at,
          updated_at,
          program:scholarship_programs (
            id,
            name
          ),
          student:students (
            id,
            student_code,
            first_name,
            last_name,
            phone,
            email,
            major,
            year
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped = (data as unknown as DbScholarshipApplicationRow[]).map(mapRowToApplication);
        return { data: mapped, source: 'supabase' };
      }

      return { data: INITIAL_APPLICATIONS, source: 'local' };
    } catch (err) {
      console.warn('ดึงข้อมูล scholarship_applications ไม่สำเร็จ, ใช้ข้อมูล local:', err);
      return { data: INITIAL_APPLICATIONS, source: 'local' };
    }
  },

  /**
   * ค้นหาใบสมัครตามรหัสติดตาม (Tracking ID) หรือรหัสนักศึกษา (Student Code)
   */
  async getApplicationByTrackingId(query: string): Promise<Application | null> {
    if (!isSupabaseConfigured()) return null;

    const clean = query.trim();

    try {
      // 1. ค้นหาจากรหัสนักศึกษาใน students table
      const { data: studentMatch } = await supabase
        .from('students')
        .select('id')
        .eq('student_code', clean)
        .maybeSingle();

      let queryBuilder = supabase
        .from('scholarship_applications')
        .select(`
          id,
          program_id,
          student_id,
          gpa,
          scholarship_type,
          status,
          note,
          reason,
          form_data,
          created_at,
          updated_at,
          program:scholarship_programs (id, name),
          student:students (id, student_code, first_name, last_name, phone, email, major, year)
        `);

      if (studentMatch) {
        queryBuilder = queryBuilder.eq('student_id', studentMatch.id);
      } else {
        // ค้นหาใน form_data->>trackingId
        queryBuilder = queryBuilder.filter('form_data->>trackingId', 'eq', clean);
      }

      const { data, error } = await queryBuilder.limit(1);

      if (error || !data || data.length === 0) return null;
      return mapRowToApplication(data[0] as unknown as DbScholarshipApplicationRow);
    } catch (err) {
      console.error('Error searching application by tracking query:', err);
      return null;
    }
  },

  /**
   * บันทึกใบสมัครใหม่ลงตาราง students, scholarship_applications, application_guardians, application_loans, application_documents
   */
  async submitFullApplication(
    formData: ApplicationFormData,
    files: UploadedFiles,
    appObj: Application
  ): Promise<{ success: boolean; trackingId: string; source: 'supabase' | 'local' }> {
    if (!isSupabaseConfigured()) {
      return { success: true, trackingId: appObj.trackingId, source: 'local' };
    }

    try {
      // 1. ตรวจสอบหรือสร้างนักศึกษาในตาราง students (Upsert by student_code)
      const names = formData.fullName.trim().split(/\s+/);
      const firstName = names[0] || formData.fullName;
      const lastName = names.slice(1).join(' ') || '-';
      const yearNum = parseInt(formData.year.replace(/[^0-9]/g, '')) || 1;

      // ค้นหา student เดิมก่อน
      let studentId: string;
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .eq('student_code', formData.studentId)
        .maybeSingle();

      if (existingStudent) {
        studentId = existingStudent.id;
        // อัปเดตข้อมูลนักศึกษาล่าสุด
        await supabase.from('students').update({
          phone: formData.phone,
          email: formData.email,
          major: formData.major,
          year: yearNum,
          updated_at: new Date().toISOString()
        }).eq('id', studentId);
      } else {
        // สร้างข้อมูลนักศึกษาใหม่
        const { data: newStudent, error: studentErr } = await supabase.from('students').insert([{
          student_code: formData.studentId,
          first_name: firstName,
          last_name: lastName,
          phone: formData.phone,
          email: formData.email,
          major: formData.major,
          year: yearNum
        }]).select('id').single();

        if (studentErr || !newStudent) throw studentErr || new Error('ไม่สามารถสร้างข้อมูลนักศึกษาได้');
        studentId = newStudent.id;
      }

      // 2. ตรวจสอบ Program ID ให้ตรงกับ scholarship_programs ในฐานข้อมูล (ถ้าเป็น UUID)
      let programId = formData.scholarshipId;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(programId);
      if (!isUuid) {
        // ถ้าเป็นรหัสแบบเดิม เช่น 'sch-01' ให้หาโปรแกรมแรกในฐานข้อมูล
        const { data: firstProgram } = await supabase
          .from('scholarship_programs')
          .select('id')
          .limit(1)
          .maybeSingle();
        if (firstProgram) {
          programId = firstProgram.id;
        }
      }

      // 3. บันทึกใบสมัครลง scholarship_applications
      const fullFormDataPayload = {
        trackingId: appObj.trackingId,
        scholarshipId: formData.scholarshipId,
        scholarshipName: appObj.scholarshipName,
        studentId: formData.studentId,
        fullName: formData.fullName,
        major: formData.major,
        year: formData.year,
        gpax: formData.gpax,
        phone: formData.phone,
        email: formData.email,
        familyIncome: formData.familyIncome,
        fatherName: formData.fatherName,
        fatherJob: formData.fatherJob,
        motherName: formData.motherName,
        motherJob: formData.motherJob,
        loanStatus: formData.loanStatus,
        volunteerHours: formData.volunteerHours,
        activities: formData.activities,
        reason: formData.reason,
        documents: appObj.documents,
        subStatus: 'submitted',
        interviewDate: 'รอการตรวจสอบเอกสาร',
        score: null,
        committeeNotes: 'ยื่นใบสมัครออนไลน์'
      };

      const { data: newAppRow, error: appErr } = await supabase
        .from('scholarship_applications')
        .insert([{
          program_id: programId,
          student_id: studentId,
          gpa: formData.gpax,
          scholarship_type: 'general',
          status: 'pending',
          reason: formData.reason,
          note: 'ยื่นใบสมัครออนไลน์ผ่านระบบ',
          form_data: fullFormDataPayload
        }])
        .select('id')
        .single();

      if (appErr || !newAppRow) throw appErr || new Error('ไม่สามารถสร้างใบสมัครได้');
      const applicationId = newAppRow.id;

      // 4. บันทึกข้อมูลบิดา-มารดาลง application_guardians
      const guardiansToInsert = [];
      if (formData.fatherName) {
        guardiansToInsert.push({
          application_id: applicationId,
          relation: 'บิดา',
          name: formData.fatherName,
          occupation: formData.fatherJob || 'ทั่วไป',
          income: Math.floor(formData.familyIncome / 2),
        });
      }
      if (formData.motherName) {
        guardiansToInsert.push({
          application_id: applicationId,
          relation: 'มารดา',
          name: formData.motherName,
          occupation: formData.motherJob || 'ทั่วไป',
          income: Math.floor(formData.familyIncome / 2),
        });
      }
      if (guardiansToInsert.length > 0) {
        await supabase.from('application_guardians').insert(guardiansToInsert);
      }

      // 5. บันทึกข้อมูลกู้ยืมลง application_loans
      if (formData.loanStatus && formData.loanStatus !== 'none') {
        await supabase.from('application_loans').insert([{
          application_id: applicationId,
          has_student_loan: true,
          details: `กองทุนเงินให้กู้ยืมเพื่อการศึกษา (${formData.loanStatus})`
        }]);
      }

      // 6. บันทึกเอกสารลง application_documents
      const docsToInsert = [];
      if (files.doc1) docsToInsert.push({ application_id: applicationId, doc_type: 'transcript', url: files.doc1 });
      if (files.doc2) docsToInsert.push({ application_id: applicationId, doc_type: 'student_id_card', url: files.doc2 });
      if (files.doc3) docsToInsert.push({ application_id: applicationId, doc_type: 'income_certificate', url: files.doc3 });
      if (docsToInsert.length > 0) {
        await supabase.from('application_documents').insert(docsToInsert);
      }

      return { success: true, trackingId: appObj.trackingId, source: 'supabase' };
    } catch (err) {
      console.error('Error submitting application to Supabase:', err);
      return { success: false, trackingId: appObj.trackingId, source: 'local' };
    }
  },

  /**
   * อัปเดตผลการพิจารณา คะแนน และวันสัมภาษณ์
   */
  async updateApplicationReview(
    trackingId: string,
    status: ApplicationStatus,
    score: number | null,
    interviewDate: string,
    notes: string
  ): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    try {
      const dbStatus = mapAppStatusToDbStatus(status);

      // ดึง application ปัจจุบันเพื่อ update form_data
      const { data: apps } = await supabase
        .from('scholarship_applications')
        .select('id, form_data')
        .filter('form_data->>trackingId', 'eq', trackingId)
        .limit(1);

      if (apps && apps.length > 0) {
        const appId = apps[0].id;
        const currentFormData = (apps[0].form_data || {}) as Record<string, unknown>;

        const updatedFormData = {
          ...currentFormData,
          subStatus: status,
          score,
          interviewDate: interviewDate || currentFormData.interviewDate,
          committeeNotes: notes
        };

        const { error } = await supabase
          .from('scholarship_applications')
          .update({
            status: dbStatus,
            note: notes,
            form_data: updatedFormData,
            updated_at: new Date().toISOString()
          })
          .eq('id', appId);

        if (error) throw error;
        return true;
      }

      return false;
    } catch (err) {
      console.error('Error updating application in Supabase:', err);
      return false;
    }
  },

  /**
   * อนุมัติทุนทันที (Quick Approve)
   */
  async quickApprove(trackingId: string): Promise<boolean> {
    return this.updateApplicationReview(
      trackingId,
      'approved',
      95,
      'อนุมัติทุนการศึกษาเรียบร้อยแล้ว',
      'อนุมัติทุนโดยมติคณะกรรมการภาควิชาคณิตศาสตร์ มจพ.'
    );
  }
};
