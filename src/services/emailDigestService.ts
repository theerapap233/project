import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface EmailDigestSettings {
  enabled: boolean;
  sendTime: string;
  recipients: string[];
  testRequestedAt: string | null;
  lastWindowEnd: string | null;
  lastDigestDate: string | null;
  lastRunAt: string | null;
  lastSentAt: string | null;
  lastSentCount: number | null;
  lastStatus: string | null;
}

export interface EmailDigestLog {
  id: number;
  ranAt: string;
  kind: 'daily' | 'test';
  sent: boolean;
  applicationCount: number;
  recipientCount: number;
  message: string | null;
}

export interface PendingDigestApplication {
  id: string;
  createdAt: string;
  fullName: string;
  studentId: string;
  scholarshipName: string;
}

interface DbSettings {
  enabled: boolean;
  send_time: string;
  recipients: string[] | null;
  test_requested_at: string | null;
  last_window_end: string | null;
  last_digest_date: string | null;
  last_run_at: string | null;
  last_sent_at: string | null;
  last_sent_count: number | null;
  last_status: string | null;
}

interface DbLog {
  id: number;
  ran_at: string;
  kind: 'daily' | 'test';
  sent: boolean;
  application_count: number;
  recipient_count: number;
  message: string | null;
}

interface DbPendingRow {
  id: string;
  created_at: string;
  form_data: Record<string, unknown> | null;
  program: { name: string } | null;
  student: { student_code: string | null; first_name: string; last_name: string } | null;
}

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const mapSettings = (row: DbSettings): EmailDigestSettings => ({
  enabled: row.enabled,
  sendTime: row.send_time || '18:00',
  recipients: row.recipients || [],
  testRequestedAt: row.test_requested_at,
  lastWindowEnd: row.last_window_end,
  lastDigestDate: row.last_digest_date,
  lastRunAt: row.last_run_at,
  lastSentAt: row.last_sent_at,
  lastSentCount: row.last_sent_count,
  lastStatus: row.last_status
});

export const emailDigestService = {
  isAvailable: isSupabaseConfigured,

  /** คืนค่า null ถ้ายังไม่ได้รัน supabase/email_digest_settings.sql */
  async getSettings(): Promise<EmailDigestSettings | null> {
    const { data, error } = await supabase
      .from('email_digest_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();
    if (error) {
      console.warn('โหลด email_digest_settings ไม่สำเร็จ:', error.message);
      return null;
    }
    return data ? mapSettings(data as DbSettings) : null;
  },

  async saveSettings(input: { enabled: boolean; sendTime: string; recipients: string[] }): Promise<boolean> {
    const { error } = await supabase
      .from('email_digest_settings')
      .update({
        enabled: input.enabled,
        send_time: input.sendTime,
        recipients: input.recipients,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1);
    if (error) console.error('บันทึก email_digest_settings ไม่สำเร็จ:', error.message);
    return !error;
  },

  /** ขอให้ Apps Script ส่งอีเมลทดสอบในรอบตรวจถัดไป (ภายในประมาณ 10 นาที) */
  async requestTest(): Promise<boolean> {
    const { error } = await supabase
      .from('email_digest_settings')
      .update({ test_requested_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) console.error('ขอส่งอีเมลทดสอบไม่สำเร็จ:', error.message);
    return !error;
  },

  async getLogs(limit = 10): Promise<EmailDigestLog[]> {
    const { data, error } = await supabase
      .from('email_digest_logs')
      .select('*')
      .order('ran_at', { ascending: false })
      .limit(limit);
    if (error || !data) return [];
    return (data as DbLog[]).map(row => ({
      id: row.id,
      ranAt: row.ran_at,
      kind: row.kind,
      sent: row.sent,
      applicationCount: row.application_count,
      recipientCount: row.recipient_count,
      message: row.message
    }));
  },

  /** ใบสมัครที่จะอยู่ในอีเมลรอบถัดไป */
  async getPendingApplications(since: string | null): Promise<PendingDigestApplication[]> {
    const from = since || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('scholarship_applications')
      .select('id, created_at, form_data, program:scholarship_programs ( name ), student:students ( student_code, first_name, last_name )')
      .gt('created_at', from)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return (data as unknown as DbPendingRow[]).map(row => {
      const fd = row.form_data || {};
      return {
        id: row.id,
        createdAt: row.created_at,
        fullName: row.student ? `${row.student.first_name} ${row.student.last_name}` : String(fd.fullName || 'ไม่ระบุชื่อ'),
        studentId: row.student?.student_code || String(fd.studentId || '-'),
        scholarshipName: (row.program?.name || String(fd.scholarshipName || 'ไม่ระบุทุน')).replace(/\s*\([A-Z0-9-]+\)\s*$/, '')
      };
    });
  }
};
