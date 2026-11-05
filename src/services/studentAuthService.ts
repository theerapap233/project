import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { StudentAccount, StudentLoginLogInput, StudentPersonalInfo } from '../types/studentAccount';
import { normalizePersonalInfo } from '../utils/studentProfile';

interface DbStudentAccount {
  id: string;
  student_code: string;
  name: string;
  email: string;
  phone: string | null;
  faculty: string | null;
  major: string | null;
  year: string | null;
  gpax: number | string | null;
  personal_info?: unknown | null;
  password_hash: string;
  password_salt: string;
  avatar_url: string | null;
  last_login_at: string | null;
  login_count: number | null;
  is_active: boolean | null;
  created_at: string;
}

export type StudentAuthSource = 'supabase' | 'local';

const mapStudentAccount = (row: DbStudentAccount): StudentAccount => ({
  id: row.id,
  studentId: row.student_code || '',
  name: row.name || '',
  email: row.email || '',
  phone: row.phone || '',
  faculty: row.faculty || 'คณะวิทยาศาสตร์ประยุกต์',
  major: row.major || '',
  year: row.year || '',
  gpax: row.gpax === null ? undefined : Number(row.gpax),
  personalInfo: row.personal_info
    ? normalizePersonalInfo(row.personal_info as Partial<StudentPersonalInfo>)
    : undefined,
  passwordHash: row.password_hash || '',
  salt: row.password_salt || '',
  avatarUrl: row.avatar_url,
  createdAt: row.created_at,
  lastLoginAt: row.last_login_at,
  loginCount: row.login_count ?? 0
});

const toDbPayload = (account: StudentAccount, includePersonalInfo = true) => ({
  student_code: account.studentId,
  name: account.name,
  email: account.email,
  phone: account.phone || null,
  faculty: account.faculty || 'คณะวิทยาศาสตร์ประยุกต์',
  major: account.major || null,
  year: account.year || null,
  gpax: typeof account.gpax === 'number' && Number.isFinite(account.gpax) ? account.gpax : null,
  ...(includePersonalInfo ? { personal_info: account.personalInfo ?? null } : {}),
  password_hash: account.passwordHash,
  password_salt: account.salt,
  avatar_url: account.avatarUrl ?? null,
  updated_at: new Date().toISOString()
});

/** ตรวจว่าข้อผิดพลาดเกิดจากคอลัมน์ personal_info ที่ยังไม่ได้สร้างในฐานข้อมูลหรือไม่ */
const isMissingPersonalInfoColumn = (error: { message?: string; code?: string } | null): boolean =>
  Boolean(
    error &&
      (error.code === 'PGRST204' ||
        error.code === '42703' ||
        /personal_info|column .* does not exist/i.test(error.message || ''))
  );

const detectDeviceType = (userAgent: string): string => {
  if (/ipad|tablet/i.test(userAgent)) return 'tablet';
  if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
  return 'desktop';
};

export const studentAuthService = {
  /**
   * ดึงบัญชีนักศึกษาทั้งหมดจากตาราง student_accounts
   */
  async getAccounts(): Promise<{ data: StudentAccount[]; source: StudentAuthSource }> {
    if (!isSupabaseConfigured()) {
      return { data: [], source: 'local' };
    }

    try {
      const { data, error } = await supabase
        .from('student_accounts')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        console.warn('ดึงข้อมูล student_accounts จาก Supabase ไม่สำเร็จ:', error.message);
        return { data: [], source: 'local' };
      }

      return {
        data: (data as DbStudentAccount[] | null)?.map(mapStudentAccount) ?? [],
        source: 'supabase'
      };
    } catch (err) {
      console.warn('เกิดข้อผิดพลาดในการดึง student_accounts:', err);
      return { data: [], source: 'local' };
    }
  },

  /**
   * ค้นหาบัญชีนักศึกษาด้วยรหัสนักศึกษา หรืออีเมล มจพ.
   */
  async findAccount(identifier: string): Promise<StudentAccount | null> {
    if (!isSupabaseConfigured()) return null;

    const cleanIdentifier = (identifier || '').trim();
    if (!cleanIdentifier) return null;

    const normalizedIdentifier = cleanIdentifier.replace(/^s/i, '');

    try {
      const { data, error } = await supabase
        .from('student_accounts')
        .select('*')
        .or(
          [
            `student_code.eq.${normalizedIdentifier}`,
            `student_code.eq.${cleanIdentifier}`,
            `email.eq.${cleanIdentifier}`
          ].join(',')
        )
        .eq('is_active', true)
        .limit(1);

      if (error) {
        console.warn('ค้นหาบัญชีนักศึกษาใน Supabase ไม่สำเร็จ:', error.message);
        return null;
      }

      const row = (data as DbStudentAccount[] | null)?.[0];
      return row ? mapStudentAccount(row) : null;
    } catch (err) {
      console.warn('เกิดข้อผิดพลาดในการค้นหาบัญชีนักศึกษา:', err);
      return null;
    }
  },

  /**
   * สร้างบัญชีนักศึกษาใหม่ลงตาราง student_accounts
   * code = 'duplicate' เมื่อรหัสนักศึกษา/อีเมลซ้ำ, 'error' เมื่อบันทึกไม่สำเร็จ
   */
  async createAccount(account: StudentAccount): Promise<{ success: boolean; source: StudentAuthSource; code?: 'duplicate' | 'error' }> {
    if (!isSupabaseConfigured()) {
      return { success: true, source: 'local' };
    }

    try {
      let { error } = await supabase.from('student_accounts').insert([toDbPayload(account)]);

      // ฐานข้อมูลรุ่นเก่าที่ยังไม่มีคอลัมน์ personal_info → บันทึกข้อมูลพื้นฐานก่อน
      if (error && isMissingPersonalInfoColumn(error)) {
        ({ error } = await supabase.from('student_accounts').insert([toDbPayload(account, false)]));
      }

      if (error) {
        console.error('Error creating student account in Supabase:', error);
        const isDuplicate = error.code === '23505' || /duplicate key|unique constraint/i.test(error.message || '');
        return { success: false, source: 'local', code: isDuplicate ? 'duplicate' : 'error' };
      }

      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error creating student account:', err);
      return { success: false, source: 'local', code: 'error' };
    }
  },

  /**
   * เพิ่มบัญชีเริ่มต้นลง Supabase (ข้ามบัญชีที่ซ้ำอยู่แล้ว)
   */
  async seedAccounts(accounts: StudentAccount[]): Promise<boolean> {
    if (!isSupabaseConfigured() || accounts.length === 0) return false;

    try {
      const { error } = await supabase
        .from('student_accounts')
        .upsert(accounts.map(account => toDbPayload(account)), { onConflict: 'student_code', ignoreDuplicates: true });

      if (error) {
        console.warn('Seed บัญชีนักศึกษาลง Supabase ไม่สำเร็จ:', error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.warn('เกิดข้อผิดพลาดในการ Seed บัญชีนักศึกษา:', err);
      return false;
    }
  },

  /**
   * อัปเดตรหัสผ่าน (hash + salt) ของนักศึกษา
   */
  async updatePassword(studentId: string, passwordHash: string, salt: string): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase
        .from('student_accounts')
        .update({ password_hash: passwordHash, password_salt: salt, updated_at: new Date().toISOString() })
        .eq('student_code', studentId);

      if (error) {
        console.error('Error updating student password in Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error updating student password:', err);
      return false;
    }
  },

  /**
   * อัปเดตข้อมูลโปรไฟล์นักศึกษา
   */
  async updateProfile(account: Partial<StudentAccount> & { studentId: string }): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    try {
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (account.name !== undefined) updates.name = account.name;
      if (account.email !== undefined) updates.email = account.email;
      if (account.phone !== undefined) updates.phone = account.phone;
      if (account.faculty !== undefined) updates.faculty = account.faculty;
      if (account.major !== undefined) updates.major = account.major;
      if (account.year !== undefined) updates.year = account.year;
      if (account.gpax !== undefined) updates.gpax = account.gpax;
      if (account.avatarUrl !== undefined) updates.avatar_url = account.avatarUrl;
      if (account.personalInfo !== undefined) updates.personal_info = account.personalInfo;

      const applyUpdate = (payload: Record<string, unknown>) =>
        supabase
          .from('student_accounts')
          .update(payload)
          .eq('student_code', account.studentId);

      let { error } = await applyUpdate(updates);

      // ฐานข้อมูลรุ่นเก่าที่ยังไม่มีคอลัมน์ personal_info → อัปเดตเฉพาะข้อมูลพื้นฐาน
      if (error && isMissingPersonalInfoColumn(error) && 'personal_info' in updates) {
        const { personal_info: _omit, ...baseUpdates } = updates;
        ({ error } = await applyUpdate(baseUpdates));
        if (!error) {
          console.warn('บันทึกข้อมูลส่วนตัวเพิ่มเติมลง Supabase ไม่ได้ เพราะยังไม่มีคอลัมน์ personal_info (รัน SQL อัปเดตตาราง student_accounts)');
          return false;
        }
      }

      if (error) {
        console.error('Error updating student profile in Supabase:', error);
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error updating student profile:', err);
      return false;
    }
  },

  /**
   * บันทึกประวัติการเข้าสู่ระบบ/ออกจากระบบลงตาราง student_login_logs
   * พร้อมอัปเดต last_login_at และ login_count เมื่อเข้าสู่ระบบสำเร็จ
   */
  async recordLogin(entry: StudentLoginLogInput): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    try {
      const userAgent = entry.userAgent ?? (typeof navigator !== 'undefined' ? navigator.userAgent : '');
      const action = entry.action ?? 'login';

      let accountId = entry.accountId ?? null;
      if (!accountId) {
        const { data: accountRow, error: findError } = await supabase
          .from('student_accounts')
          .select('id')
          .eq('student_code', entry.studentId)
          .maybeSingle();

        if (findError) {
          console.warn('ตรวจสอบบัญชีสำหรับบันทึก log ไม่สำเร็จ:', findError.message);
        }
        accountId = (accountRow as { id?: string } | null)?.id ?? null;
      }

      const { error } = await supabase.from('student_login_logs').insert([
        {
          student_account_id: accountId,
          student_code: entry.studentId,
          student_name: entry.studentName ?? null,
          action,
          success: entry.success,
          failure_reason: entry.failureReason ?? null,
          user_agent: userAgent || null,
          device_type: detectDeviceType(userAgent)
        }
      ]);

      if (error) {
        console.warn('บันทึกประวัติการเข้าสู่ระบบลง Supabase ไม่สำเร็จ:', error.message);
        return false;
      }

      if (entry.success && action === 'login' && accountId) {
        const { data: currentRow } = await supabase
          .from('student_accounts')
          .select('login_count')
          .eq('id', accountId)
          .maybeSingle();

        const currentCount = Number((currentRow as { login_count?: number } | null)?.login_count ?? 0);

        await supabase
          .from('student_accounts')
          .update({ last_login_at: new Date().toISOString(), login_count: currentCount + 1 })
          .eq('id', accountId);
      }

      return true;
    } catch (err) {
      console.warn('เกิดข้อผิดพลาดในการบันทึกประวัติการเข้าสู่ระบบ:', err);
      return false;
    }
  }
};
