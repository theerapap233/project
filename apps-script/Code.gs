/**
 * อีเมลสรุปผู้สมัครทุนรายวัน — Google Apps Script
 * ระบบทุนการศึกษา ภาควิชาคณิตศาสตร์ มจพ.
 *
 * วิธีใช้ (ดูรายละเอียดใน apps-script/README.md)
 * 1. วางโค้ดนี้ทั้งไฟล์ในไฟล์ "รหัส.gs" ของ Apps Script
 * 2. ตั้ง Script Properties: SUPABASE_URL, SUPABASE_KEY
 * 3. เลือกฟังก์ชัน testConnection แล้วกด "เรียกใช้" (ครั้งแรก Google จะขอสิทธิ์)
 * 4. เลือกฟังก์ชัน setupTrigger แล้วกด "เรียกใช้" ครั้งเดียว
 *
 * เวลาส่ง ผู้รับ และการเปิด/ปิด ตั้งได้จากหน้าเว็บ (แท็บ "แจ้งเตือนอีเมล")
 * สคริปต์ตรวจทุก 10 นาที จึงส่งช้ากว่าเวลาที่ตั้งได้ไม่เกินประมาณ 10 นาที
 */

const TZ = 'Asia/Bangkok';
const SENDER_NAME = 'ระบบทุนการศึกษา ภาควิชาคณิตศาสตร์ มจพ.';
const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

/* ========================= ฟังก์ชันที่กดเรียกใช้เอง ========================= */

/** ตั้งให้ระบบตรวจทุก 10 นาที (รันครั้งเดียว รันซ้ำได้ไม่ซ้อนกัน) */
function setupTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'checkAndSend')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('checkAndSend').timeBased().everyMinutes(10).create();
  Logger.log('ตั้งเวลาเรียบร้อย: ระบบจะตรวจทุก 10 นาที');
}

/** หยุดการทำงานอัตโนมัติทั้งหมด */
function removeTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'checkAndSend')
    .forEach(t => ScriptApp.deleteTrigger(t));
  Logger.log('ยกเลิกการทำงานอัตโนมัติแล้ว');
}

/** ทดสอบการเชื่อมต่อ Supabase และขอสิทธิ์ครั้งแรก (ไม่ส่งอีเมล) */
function testConnection() {
  const settings = getSettings_();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const apps = fetchApplications_(since, new Date());
  Logger.log('เชื่อมต่อ Supabase สำเร็จ');
  Logger.log('เปิดใช้งาน: ' + settings.enabled + ' | เวลาส่ง: ' + settings.send_time + ' | ผู้รับ: ' + (settings.recipients || []).join(', '));
  Logger.log('ผู้สมัครใน 24 ชม. ที่ผ่านมา: ' + apps.length + ' ใบสมัคร');
  Logger.log('โควตาอีเมลคงเหลือวันนี้: ' + MailApp.getRemainingDailyQuota());
}

/* ========================= ทำงานอัตโนมัติทุก 10 นาที ========================= */

function checkAndSend() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return;
  try {
    const now = new Date();
    const settings = getSettings_();

    // 1) ปุ่ม "ส่งอีเมลทดสอบ" จากหน้าเว็บ
    if (settings.test_requested_at) {
      sendTest_(settings, now);
    }

    // 2) รอบประจำวัน
    const today = Utilities.formatDate(now, TZ, 'yyyy-MM-dd');
    const nowHHmm = Utilities.formatDate(now, TZ, 'HH:mm');
    const due = settings.enabled && settings.last_digest_date !== today && nowHHmm >= settings.send_time;

    if (due) {
      sendDaily_(settings, now, today);
    } else {
      updateSettings_({ last_run_at: now.toISOString() });
    }
  } finally {
    lock.releaseLock();
  }
}

/* ========================= การส่ง ========================= */

function sendDaily_(settings, now, today) {
  const since = settings.last_window_end
    ? new Date(settings.last_window_end)
    : new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const apps = fetchApplications_(since, now);
  const recipients = cleanRecipients_(settings.recipients);

  let sent = false;
  let status;
  if (apps.length === 0) {
    status = 'ไม่มีผู้สมัครใหม่ จึงไม่ได้ส่งอีเมล';
  } else if (recipients.length === 0) {
    status = 'มีผู้สมัคร ' + apps.length + ' ใบ แต่ยังไม่ได้ตั้งอีเมลผู้รับ';
  } else {
    const mail = buildEmail_(apps, since, now, false);
    MailApp.sendEmail({ to: recipients.join(','), subject: mail.subject, htmlBody: mail.html, body: mail.text, name: SENDER_NAME });
    sent = true;
    status = 'ส่งสรุป ' + apps.length + ' ใบสมัคร ถึง ' + recipients.length + ' คน';
  }

  // ถ้าไม่มีผู้รับ ยังไม่ขยับช่วงเวลา เพื่อให้ใบสมัครเหล่านี้ไปอยู่ในอีเมลรอบถัดไป
  const patch = {
    last_digest_date: today,
    last_run_at: now.toISOString(),
    last_status: status,
    last_sent_count: apps.length
  };
  if (sent || apps.length === 0) patch.last_window_end = now.toISOString();
  if (sent) patch.last_sent_at = now.toISOString();
  updateSettings_(patch);
  insertLog_('daily', sent, apps.length, sent ? recipients.length : 0, status);
}

function sendTest_(settings, now) {
  const recipients = cleanRecipients_(settings.recipients);
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  let status;
  let sent = false;
  let count = 0;

  if (recipients.length === 0) {
    status = 'ทดสอบไม่สำเร็จ: ยังไม่ได้ตั้งอีเมลผู้รับ';
  } else {
    const apps = fetchApplications_(since, now);
    count = apps.length;
    const mail = buildEmail_(apps, since, now, true);
    MailApp.sendEmail({ to: recipients.join(','), subject: mail.subject, htmlBody: mail.html, body: mail.text, name: SENDER_NAME });
    sent = true;
    status = 'ส่งอีเมลทดสอบถึง ' + recipients.length + ' คนแล้ว';
  }

  updateSettings_({ test_requested_at: null, last_status: status, last_run_at: now.toISOString() });
  insertLog_('test', sent, count, sent ? recipients.length : 0, status);
}

/* ========================= สร้างเนื้อหาอีเมล ========================= */

function buildEmail_(apps, since, until, isTest) {
  const prefix = isTest ? '[ทดสอบ] ' : '';
  const periodText = thaiDateTime_(since) + ' – ' + thaiDateTime_(until);
  const subject = apps.length > 0
    ? prefix + '[ระบบทุน] ผู้สมัครใหม่ ' + apps.length + ' ใบสมัคร (' + thaiDate_(until) + ')'
    : prefix + '[ระบบทุน] ไม่มีผู้สมัครใหม่ (' + thaiDate_(until) + ')';

  const items = apps.map(row => {
    const fd = row.form_data || {};
    const st = row.student;
    return {
      name: st ? st.first_name + ' ' + st.last_name : String(fd.fullName || 'ไม่ระบุชื่อ'),
      studentId: (st && st.student_code) || String(fd.studentId || '-'),
      year: st && st.year ? 'ปี ' + st.year : String(fd.year || ''),
      scholarship: cleanScholarshipName_((row.program && row.program.name) || String(fd.scholarshipName || 'ไม่ระบุทุน')),
      time: Utilities.formatDate(new Date(row.created_at), TZ, 'HH:mm')
    };
  });

  const perScholarship = {};
  items.forEach(i => { perScholarship[i.scholarship] = (perScholarship[i.scholarship] || 0) + 1; });
  const summaryHtml = Object.keys(perScholarship)
    .sort((a, b) => perScholarship[b] - perScholarship[a])
    .map(name => '<li>' + esc_(name) + ': <strong>' + perScholarship[name] + '</strong> คน</li>')
    .join('');

  const rowsHtml = items.map((i, idx) =>
    '<tr>' +
      '<td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b">' + (idx + 1) + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #e2e8f0"><strong>' + esc_(i.name) + '</strong><br>' +
        '<span style="color:#64748b;font-size:12px">' + esc_(i.studentId) + ' ' + esc_(i.year) + '</span></td>' +
      '<td style="padding:8px;border-bottom:1px solid #e2e8f0">' + esc_(i.scholarship) + '</td>' +
      '<td style="padding:8px;border-bottom:1px solid #e2e8f0;color:#64748b;white-space:nowrap">' + i.time + ' น.</td>' +
    '</tr>'
  ).join('');

  const siteUrl = PropertiesService.getScriptProperties().getProperty('SITE_URL') || '';
  const button = /^https?:\/\//.test(siteUrl)
    ? '<p style="margin:20px 0"><a href="' + esc_(siteUrl) + '" style="background:#077b38;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold">เปิดหน้าจัดการใบสมัคร</a></p>'
    : '';

  const testNote = isTest
    ? '<p style="background:#fffbeb;border:1px solid #fde68a;padding:8px 12px;border-radius:8px">นี่คืออีเมลทดสอบจากปุ่ม "ส่งอีเมลทดสอบ" แสดงผู้สมัครใน 24 ชั่วโมงที่ผ่านมา</p>'
    : '';

  const body = apps.length === 0
    ? '<p>ไม่มีผู้สมัครใหม่ในช่วง ' + esc_(periodText) + '</p>'
    : '<p style="margin-top:0;color:#64748b">ช่วงเวลา ' + esc_(periodText) + '</p>' +
      '<p style="margin-bottom:4px"><strong>แยกตามทุน</strong></p><ul style="margin-top:0">' + summaryHtml + '</ul>' +
      '<table style="border-collapse:collapse;width:100%;font-size:14px">' +
        '<thead><tr style="background:#f1f5f9;text-align:left"><th style="padding:8px">#</th><th style="padding:8px">ผู้สมัคร</th><th style="padding:8px">ทุนที่สมัคร</th><th style="padding:8px">เวลา</th></tr></thead>' +
        '<tbody>' + rowsHtml + '</tbody></table>';

  const html =
    '<div style="font-family:Tahoma,Arial,sans-serif;max-width:680px;color:#0f172a">' +
      testNote +
      '<h2 style="color:#077b38;margin-bottom:4px">' + (apps.length > 0 ? 'มีผู้สมัครทุนใหม่ ' + apps.length + ' ใบสมัคร' : 'ไม่มีผู้สมัครทุนใหม่') + '</h2>' +
      body + button +
      '<p style="color:#94a3b8;font-size:12px">อีเมลนี้ส่งอัตโนมัติจากระบบทุนการศึกษา ภาควิชาคณิตศาสตร์ มจพ. ตั้งเวลาและผู้รับได้ที่หน้าแอดมิน แท็บ "แจ้งเตือนอีเมล"</p>' +
    '</div>';

  const text = (apps.length > 0 ? 'มีผู้สมัครทุนใหม่ ' + apps.length + ' ใบสมัคร' : 'ไม่มีผู้สมัครทุนใหม่') + ' (' + periodText + ')\n\n' +
    items.map((i, idx) => (idx + 1) + '. ' + i.name + ' (' + i.studentId + ') - ' + i.scholarship + ' เวลา ' + i.time + ' น.').join('\n') +
    (siteUrl ? '\n\nเปิดหน้าจัดการใบสมัคร: ' + siteUrl : '');

  return { subject: subject, html: html, text: text };
}

/* ========================= Supabase ========================= */

function supabase_(method, path, payload) {
  const props = PropertiesService.getScriptProperties();
  const url = (props.getProperty('SUPABASE_URL') || '').replace(/\/+$/, '');
  const key = props.getProperty('SUPABASE_KEY') || '';
  if (!/^https:\/\//.test(url) || !key) {
    throw new Error('ยังไม่ได้ตั้ง SUPABASE_URL หรือ SUPABASE_KEY ใน Script Properties');
  }
  const options = {
    method: method,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      Prefer: 'return=minimal'
    },
    contentType: 'application/json',
    muteHttpExceptions: true
  };
  if (payload !== undefined) options.payload = JSON.stringify(payload);

  const res = UrlFetchApp.fetch(url + '/rest/v1/' + path, options);
  const code = res.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error('Supabase ตอบกลับ ' + code + ': ' + res.getContentText().slice(0, 300));
  }
  const text = res.getContentText();
  return text ? JSON.parse(text) : null;
}

function getSettings_() {
  const rows = supabase_('get', 'email_digest_settings?id=eq.1&select=*');
  if (!rows || rows.length === 0) {
    throw new Error('ไม่พบตาราง email_digest_settings กรุณารันไฟล์ supabase/email_digest_settings.sql ก่อน');
  }
  const s = rows[0];
  s.send_time = /^\d{2}:\d{2}$/.test(s.send_time || '') ? s.send_time : '18:00';
  return s;
}

function updateSettings_(patch) {
  patch.updated_at = new Date().toISOString();
  supabase_('patch', 'email_digest_settings?id=eq.1', patch);
}

function insertLog_(kind, sent, appCount, recipientCount, message) {
  try {
    supabase_('post', 'email_digest_logs', {
      kind: kind, sent: sent, application_count: appCount, recipient_count: recipientCount, message: message
    });
  } catch (err) {
    Logger.log('บันทึกประวัติไม่สำเร็จ: ' + err.message);
  }
}

function fetchApplications_(since, until) {
  const query = 'scholarship_applications' +
    '?select=id,created_at,form_data,program:scholarship_programs(name),student:students(student_code,first_name,last_name,year)' +
    '&created_at=gt.' + encodeURIComponent(since.toISOString()) +
    '&created_at=lte.' + encodeURIComponent(until.toISOString()) +
    '&order=created_at.asc';
  return supabase_('get', query) || [];
}

/* ========================= ตัวช่วย ========================= */

function cleanRecipients_(list) {
  const seen = {};
  return (list || [])
    .map(e => String(e || '').trim().toLowerCase())
    .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    .filter(e => (seen[e] ? false : (seen[e] = true)));
}

function cleanScholarshipName_(name) {
  return String(name).replace(/\s*\([A-Z0-9-]+\)\s*$/, '').trim();
}

function esc_(value) {
  return String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function thaiDate_(date) {
  const d = Number(Utilities.formatDate(date, TZ, 'd'));
  const m = Number(Utilities.formatDate(date, TZ, 'M'));
  const y = Number(Utilities.formatDate(date, TZ, 'yyyy')) + 543;
  return d + ' ' + THAI_MONTHS[m - 1] + ' ' + y;
}

function thaiDateTime_(date) {
  return thaiDate_(date) + ' ' + Utilities.formatDate(date, TZ, 'HH:mm') + ' น.';
}
