// Supabase Edge Function: daily-application-digest
// ส่งอีเมลสรุปรายชื่อผู้สมัครทุนใหม่ วันละ 1 ครั้ง (เรียกจาก pg_cron)
// ถ้าในช่วงเวลานั้นไม่มีใครสมัคร จะไม่ส่งอีเมล
//
// Secrets ที่ใช้ (ตั้งใน Dashboard > Edge Functions > Secrets):
//   RESEND_API_KEY        ใช้ตัวเดียวกับระบบ OTP
//   EMAIL_FROM            ใช้ตัวเดียวกับระบบ OTP
//   DIGEST_CRON_SECRET    รหัสลับสุ่มยาว ๆ ใช้ยืนยันว่าคนเรียกคือ pg_cron ของเราเอง
//   DIGEST_TO             (ไม่บังคับ) อีเมลผู้รับ คั่นด้วยจุลภาค ถ้าไม่ตั้งจะส่งถึงเจ้าหน้าที่ทุกคนที่ is_active
//   SITE_URL              (ไม่บังคับ) ลิงก์เว็บไซต์ ใส่เป็นปุ่มในอีเมล
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  Supabase ใส่ให้อัตโนมัติ

import { createClient } from 'npm:@supabase/supabase-js@2';

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

// ตัดรหัสทุนท้ายชื่อ เช่น "ทุน TA (MATH-TA-2567)" -> "ทุน TA"
const cleanScholarshipName = (name: string) => name.replace(/\s*\([A-Z0-9-]+\)\s*$/, '').trim();

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// เทียบรหัสลับแบบเวลาคงที่ กันการเดาทีละตัวอักษร
const safeEqual = (a: string, b: string) => {
  const ae = new TextEncoder().encode(a);
  const be = new TextEncoder().encode(b);
  if (ae.length !== be.length) return false;
  let diff = 0;
  for (let i = 0; i < ae.length; i++) diff |= ae[i] ^ be[i];
  return diff === 0;
};

const thaiDateTime = (iso: string, withTime = true) =>
  new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {})
  }).format(new Date(iso));

const thaiTime = (iso: string) =>
  new Intl.DateTimeFormat('th-TH', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

interface Row {
  id: string;
  created_at: string;
  form_data: Record<string, unknown> | null;
  program: { name: string } | null;
  student: { student_code: string | null; first_name: string; last_name: string; year: number | null; major: string | null } | null;
}

Deno.serve(async request => {
  if (request.method !== 'POST') {
    return json(405, { ok: false, message: 'Method not allowed' });
  }

  const cronSecret = Deno.env.get('DIGEST_CRON_SECRET') || '';
  const provided = request.headers.get('x-cron-secret') || '';
  if (cronSecret.length < 32 || !safeEqual(provided, cronSecret)) {
    return json(401, { ok: false, message: 'Unauthorized' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const emailFrom = Deno.env.get('EMAIL_FROM');
  const siteUrl = (Deno.env.get('SITE_URL') || '').trim();

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !emailFrom) {
    console.error('daily-application-digest: secrets are not configured');
    return json(500, { ok: false, message: 'Secrets are not configured' });
  }

  // ค่าที่ส่งมาได้: { "hours": 24, "dryRun": false }
  let hours = 24;
  let dryRun = false;
  try {
    const body = await request.json();
    if (body && typeof body === 'object') {
      const h = Number((body as Record<string, unknown>).hours);
      if (Number.isFinite(h) && h > 0 && h <= 24 * 60) hours = h;
      dryRun = (body as Record<string, unknown>).dryRun === true;
    }
  } catch {
    // ไม่มี body ก็ใช้ค่าเริ่มต้น
  }

  const until = new Date();
  const since = new Date(until.getTime() - hours * 60 * 60 * 1000);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });

  const { data, error } = await supabase
    .from('scholarship_applications')
    .select(`
      id,
      created_at,
      form_data,
      program:scholarship_programs ( name ),
      student:students ( student_code, first_name, last_name, year, major )
    `)
    .gte('created_at', since.toISOString())
    .lt('created_at', until.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('daily-application-digest: query failed', error.message);
    return json(500, { ok: false, message: 'Query failed' });
  }

  const rows = (data || []) as unknown as Row[];
  if (rows.length === 0) {
    return json(200, { ok: true, sent: false, count: 0, message: 'ไม่มีผู้สมัครใหม่ ไม่ส่งอีเมล' });
  }

  const items = rows.map(row => {
    const fd = row.form_data || {};
    const name = row.student
      ? `${row.student.first_name} ${row.student.last_name}`
      : String(fd.fullName || 'ไม่ระบุชื่อ');
    const studentId = row.student?.student_code || String(fd.studentId || '-');
    const year = row.student?.year ? `ปี ${row.student.year}` : String(fd.year || '');
    const scholarship = cleanScholarshipName(row.program?.name || String(fd.scholarshipName || 'ไม่ระบุทุน'));
    const trackingId = String(fd.trackingId || '');
    return { name, studentId, year, scholarship, trackingId, createdAt: row.created_at };
  });

  // นับจำนวนผู้สมัครแยกตามทุน
  const perScholarship = new Map<string, number>();
  items.forEach(item => perScholarship.set(item.scholarship, (perScholarship.get(item.scholarship) || 0) + 1));
  const uniqueStudents = new Set(items.map(i => i.studentId)).size;

  // ผู้รับ: DIGEST_TO ถ้ามี ไม่งั้นเจ้าหน้าที่ทุกคนที่ยังใช้งานอยู่
  let recipients = (Deno.env.get('DIGEST_TO') || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(isValidEmail);

  if (recipients.length === 0) {
    const { data: staff, error: staffError } = await supabase
      .from('staff_users')
      .select('email')
      .eq('is_active', true);
    if (staffError) {
      console.error('daily-application-digest: staff query failed', staffError.message);
      return json(500, { ok: false, message: 'Staff query failed' });
    }
    recipients = (staff || [])
      .map(s => String(s.email || '').trim().toLowerCase())
      .filter(isValidEmail);
  }

  recipients = Array.from(new Set(recipients));
  if (recipients.length === 0) {
    return json(200, { ok: true, sent: false, count: items.length, message: 'ไม่พบอีเมลผู้รับ' });
  }

  const periodText = `${thaiDateTime(since.toISOString())} – ${thaiDateTime(until.toISOString())}`;
  const subject = `[ระบบทุน] ผู้สมัครใหม่ ${items.length} ใบสมัคร (${thaiDateTime(until.toISOString(), false)})`;

  const summaryRowsHtml = Array.from(perScholarship.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => `<li>${escapeHtml(name)}: <strong>${count}</strong> คน</li>`)
    .join('');

  const tableRowsHtml = items
    .map(
      (item, index) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">${index + 1}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>${escapeHtml(item.name)}</strong><br><span style="color:#64748b;font-size:12px">${escapeHtml(item.studentId)} ${escapeHtml(item.year)}</span></td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0">${escapeHtml(item.scholarship)}</td>
          <td style="padding:8px;border-bottom:1px solid #e2e8f0;white-space:nowrap;color:#64748b">${escapeHtml(thaiTime(item.createdAt))} น.</td>
        </tr>`
    )
    .join('');

  const buttonHtml = /^https?:\/\//.test(siteUrl)
    ? `<p style="margin:20px 0"><a href="${escapeHtml(siteUrl)}" style="background:#077b38;color:#ffffff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">เปิดหน้าจัดการใบสมัคร</a></p>`
    : '';

  const html = `
    <div style="font-family:Tahoma,Arial,sans-serif;max-width:680px;color:#0f172a">
      <h2 style="color:#077b38;margin-bottom:4px">มีผู้สมัครทุนใหม่ ${items.length} ใบสมัคร</h2>
      <p style="margin-top:0;color:#64748b">ช่วงเวลา ${escapeHtml(periodText)} · นักศึกษา ${uniqueStudents} คน</p>
      <p style="margin-bottom:4px"><strong>แยกตามทุน</strong></p>
      <ul style="margin-top:0">${summaryRowsHtml}</ul>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        <thead>
          <tr style="background:#f1f5f9;text-align:left">
            <th style="padding:8px">#</th><th style="padding:8px">ผู้สมัคร</th><th style="padding:8px">ทุนที่สมัคร</th><th style="padding:8px">เวลา</th>
          </tr>
        </thead>
        <tbody>${tableRowsHtml}</tbody>
      </table>
      ${buttonHtml}
      <p style="color:#94a3b8;font-size:12px">อีเมลนี้ส่งอัตโนมัติวันละ 1 ครั้งจากระบบทุนการศึกษา ภาควิชาคณิตศาสตร์ มจพ. และจะไม่ส่งในวันที่ไม่มีผู้สมัคร</p>
    </div>`;

  const text = [
    `มีผู้สมัครทุนใหม่ ${items.length} ใบสมัคร (${periodText})`,
    '',
    ...items.map((item, i) => `${i + 1}. ${item.name} (${item.studentId}) - ${item.scholarship} เวลา ${thaiTime(item.createdAt)} น.`),
    siteUrl ? `\nเปิดหน้าจัดการใบสมัคร: ${siteUrl}` : ''
  ].join('\n');

  if (dryRun) {
    return json(200, { ok: true, sent: false, dryRun: true, count: items.length, recipients: recipients.length, subject, preview: text });
  }

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: emailFrom, to: recipients, subject, html, text })
  });

  if (!emailResponse.ok) {
    const detail = await emailResponse.text();
    console.error('daily-application-digest: Resend rejected email', emailResponse.status, detail);
    return json(502, { ok: false, message: 'ส่งอีเมลไม่สำเร็จ', status: emailResponse.status, detail });
  }

  return json(200, { ok: true, sent: true, count: items.length, recipients: recipients.length });
});
