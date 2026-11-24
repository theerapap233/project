import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useScholarship } from '../../context/ScholarshipContext';
import {
  emailDigestService,
  EmailDigestLog,
  EmailDigestSettings,
  EMAIL_PATTERN,
  PendingDigestApplication
} from '../../services/emailDigestService';

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

const bangkokParts = (date: Date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '';
  const hour = get('hour') === '24' ? '00' : get('hour');
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${hour}:${get('minute')}` };
};

const thaiDateTime = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat('th-TH', {
        timeZone: 'Asia/Bangkok',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(iso)) + ' น.'
    : '-';

const minutesAgo = (iso: string) => Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));

const parseRecipients = (text: string) => {
  const all = text
    .split(/[\s,;]+/)
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  const valid = Array.from(new Set(all.filter(e => EMAIL_PATTERN.test(e))));
  const invalid = all.filter(e => !EMAIL_PATTERN.test(e));
  return { valid, invalid };
};

const card: React.CSSProperties = {
  background: 'var(--surface-card, #ffffff)',
  border: '1px solid var(--border-light, #e2e8f0)',
  borderRadius: 14,
  padding: '18px 20px'
};

const label: React.CSSProperties = {
  display: 'block',
  fontSize: '0.84rem',
  fontWeight: 700,
  color: 'var(--navy-800, #1e293b)',
  marginBottom: 6
};

const hint: React.CSSProperties = { fontSize: '0.76rem', color: 'var(--text-muted, #64748b)', marginTop: 4 };

/** หน้าจัดการการส่งอีเมลสรุปผู้สมัครรายวัน */
export const EmailDigestSettingsPanel: React.FC = () => {
  const { showToast } = useScholarship();

  const [loading, setLoading] = useState(true);
  const [missingTable, setMissingTable] = useState(false);
  const [settings, setSettings] = useState<EmailDigestSettings | null>(null);
  const [logs, setLogs] = useState<EmailDigestLog[]>([]);
  const [pending, setPending] = useState<PendingDigestApplication[]>([]);

  const [enabled, setEnabled] = useState(false);
  const [sendTime, setSendTime] = useState('18:00');
  const [recipientsText, setRecipientsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [requestingTest, setRequestingTest] = useState(false);

  const load = useCallback(async (resetForm: boolean) => {
    const s = await emailDigestService.getSettings();
    if (!s) {
      setMissingTable(true);
      setLoading(false);
      return;
    }
    setMissingTable(false);
    setSettings(s);
    if (resetForm) {
      setEnabled(s.enabled);
      setSendTime(s.sendTime);
      setRecipientsText(s.recipients.join('\n'));
    }
    const [l, p] = await Promise.all([
      emailDigestService.getLogs(10),
      emailDigestService.getPendingApplications(s.lastWindowEnd)
    ]);
    setLogs(l);
    setPending(p);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!emailDigestService.isAvailable()) {
      setLoading(false);
      return;
    }
    load(true);
  }, [load]);

  // ระหว่างรออีเมลทดสอบ รีเฟรชสถานะทุก 30 วินาที
  useEffect(() => {
    if (!settings?.testRequestedAt) return;
    const timer = window.setInterval(() => load(false), 30000);
    return () => window.clearInterval(timer);
  }, [settings?.testRequestedAt, load]);

  const { valid: recipients, invalid: invalidRecipients } = useMemo(() => parseRecipients(recipientsText), [recipientsText]);

  const isDirty =
    !!settings &&
    (enabled !== settings.enabled ||
      sendTime !== settings.sendTime ||
      recipients.join(',') !== settings.recipients.join(','));

  const nextSendText = useMemo(() => {
    if (!settings || !settings.enabled) return 'ปิดการส่งอยู่';
    const now = bangkokParts(new Date());
    if (settings.lastDigestDate === now.date) return `พรุ่งนี้ ${settings.sendTime} น.`;
    if (now.time < settings.sendTime) return `วันนี้ ${settings.sendTime} น.`;
    return 'ภายในประมาณ 10 นาที (เลยเวลาที่ตั้งไว้แล้ว)';
  }, [settings]);

  const health = useMemo(() => {
    if (!settings?.lastRunAt) {
      return { ok: false, text: 'Apps Script ยังไม่เคยทำงาน — ตั้งค่า Apps Script และรัน setupTrigger ก่อน' };
    }
    const mins = minutesAgo(settings.lastRunAt);
    if (mins > 30) {
      return { ok: false, text: `Apps Script ไม่ได้ทำงานมา ${mins} นาที — ตรวจสอบ Trigger ใน Apps Script` };
    }
    return { ok: true, text: `ทำงานปกติ (ตรวจล่าสุด ${mins} นาทีที่แล้ว)` };
  }, [settings?.lastRunAt]);

  const handleSave = async () => {
    if (invalidRecipients.length > 0) {
      showToast(`อีเมลไม่ถูกต้อง: ${invalidRecipients.join(', ')}`, 'error');
      return;
    }
    if (enabled && recipients.length === 0) {
      showToast('กรุณาใส่อีเมลผู้รับอย่างน้อย 1 อีเมลก่อนเปิดการส่ง', 'warning');
      return;
    }
    setSaving(true);
    const ok = await emailDigestService.saveSettings({ enabled, sendTime, recipients });
    setSaving(false);
    if (ok) {
      showToast('บันทึกการตั้งค่าอีเมลแล้ว', 'success');
      load(true);
    } else {
      showToast('บันทึกไม่สำเร็จ กรุณาลองใหม่', 'error');
    }
  };

  const handleTest = async () => {
    if (isDirty) {
      showToast('กรุณากดบันทึกการตั้งค่าก่อนส่งอีเมลทดสอบ', 'warning');
      return;
    }
    if (!settings || settings.recipients.length === 0) {
      showToast('กรุณาใส่อีเมลผู้รับและบันทึกก่อน', 'warning');
      return;
    }
    setRequestingTest(true);
    const ok = await emailDigestService.requestTest();
    setRequestingTest(false);
    if (ok) {
      showToast('ส่งคำขอแล้ว อีเมลทดสอบจะถูกส่งภายในประมาณ 10 นาที', 'success');
      load(false);
    } else {
      showToast('ส่งคำขอไม่สำเร็จ', 'error');
    }
  };

  if (!emailDigestService.isAvailable()) {
    return (
      <div className="admin-tab-pane" style={card}>
        ระบบยังไม่ได้เชื่อมต่อ Supabase จึงตั้งค่าการส่งอีเมลไม่ได้ (ตั้ง VITE_SUPABASE_URL และ VITE_SUPABASE_ANON_KEY ในไฟล์ .env)
      </div>
    );
  }

  if (loading) {
    return <div className="admin-tab-pane" style={{ ...card, color: 'var(--text-muted)' }}>กำลังโหลดการตั้งค่า...</div>;
  }

  if (missingTable) {
    return (
      <div className="admin-tab-pane" style={{ ...card, borderColor: '#fde68a', background: '#fffbeb' }}>
        <strong>ยังไม่ได้สร้างตารางตั้งค่าอีเมล</strong>
        <p style={{ margin: '6px 0 0', fontSize: '0.88rem' }}>
          รันไฟล์ <code>supabase/email_digest_settings.sql</code> ใน Supabase SQL Editor แล้วรีเฟรชหน้านี้
        </p>
      </div>
    );
  }

  return (
    <div className="admin-tab-pane" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* สถานะ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <div style={card}>
          <div style={hint}>สถานะ</div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: 4, color: settings?.enabled ? '#047857' : '#64748b' }}>
            {settings?.enabled ? '● เปิดการส่งอยู่' : '○ ปิดการส่งอยู่'}
          </div>
          <div style={{ ...hint, color: health.ok ? '#047857' : '#b45309' }}>{health.text}</div>
        </div>
        <div style={card}>
          <div style={hint}>ส่งรอบถัดไป</div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: 4 }}>{nextSendText}</div>
          <div style={hint}>ไม่มีผู้สมัครในรอบนั้น จะไม่ส่งอีเมล</div>
        </div>
        <div style={card}>
          <div style={hint}>ส่งล่าสุด</div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginTop: 4 }}>{thaiDateTime(settings?.lastSentAt || null)}</div>
          <div style={hint}>{settings?.lastStatus || 'ยังไม่มีประวัติ'}</div>
        </div>
      </div>

      {/* ฟอร์มตั้งค่า */}
      <div style={card}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem' }}>ตั้งค่าอีเมลสรุปผู้สมัครรายวัน</h3>
        <p style={{ ...hint, marginTop: 0, marginBottom: 16 }}>
          ระบบส่งรายชื่อผู้สมัครใหม่ตั้งแต่รอบก่อน ถึงอีเมลผู้รับวันละ 1 ครั้ง ส่งจริงช้ากว่าเวลาที่ตั้งได้ไม่เกินประมาณ 10 นาที
        </p>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 18 }}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={e => setEnabled(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--math-green, #077b38)' }}
          />
          <span style={{ fontWeight: 700 }}>เปิดการส่งอีเมลอัตโนมัติ</span>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          <div>
            <label htmlFor="digest-time" style={label}>เวลาส่ง (เวลาไทย)</label>
            <select
              id="digest-time"
              value={sendTime}
              onChange={e => setSendTime(e.target.value)}
              style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: '1px solid var(--border-light, #cbd5e1)', fontFamily: 'inherit', fontSize: '0.92rem' }}
            >
              {!TIME_OPTIONS.includes(sendTime) && <option value={sendTime}>{sendTime} น.</option>}
              {TIME_OPTIONS.map(t => (
                <option key={t} value={t}>{t} น.</option>
              ))}
            </select>
            <div style={hint}>ถ้าตั้งเวลาที่เลยมาแล้วของวันนี้ และวันนี้ยังไม่ได้ส่ง ระบบจะส่งรอบแรกภายใน 10 นาที</div>
          </div>

          <div>
            <label htmlFor="digest-recipients" style={label}>อีเมลผู้รับ</label>
            <textarea
              id="digest-recipients"
              value={recipientsText}
              onChange={e => setRecipientsText(e.target.value)}
              rows={4}
              placeholder={'อาจารย์คนละ 1 บรรทัด เช่น\nsomchai.k@sci.kmutnb.ac.th'}
              style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: `1px solid ${invalidRecipients.length ? '#fca5a5' : 'var(--border-light, #cbd5e1)'}`, fontFamily: 'inherit', fontSize: '0.9rem', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ ...hint, color: invalidRecipients.length ? '#b91c1c' : hint.color }}>
              {invalidRecipients.length
                ? `อีเมลไม่ถูกต้อง: ${invalidRecipients.join(', ')}`
                : `ผู้รับ ${recipients.length} คน · คั่นด้วยการขึ้นบรรทัดใหม่หรือจุลภาค`}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20, alignItems: 'center' }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !isDirty}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleTest}
            disabled={requestingTest || !!settings?.testRequestedAt}
          >
            {settings?.testRequestedAt ? 'รอส่งอีเมลทดสอบ...' : 'ส่งอีเมลทดสอบ'}
          </button>
          {isDirty && <span style={{ fontSize: '0.8rem', color: '#b45309' }}>มีการแก้ไขที่ยังไม่ได้บันทึก</span>}
          {settings?.testRequestedAt && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              ขอส่งเมื่อ {thaiDateTime(settings.testRequestedAt)} · จะส่งภายในประมาณ 10 นาที
            </span>
          )}
        </div>
      </div>

      {/* ตัวอย่างรายชื่อรอบถัดไป */}
      <div style={card}>
        <h3 style={{ margin: '0 0 4px', fontSize: '1rem' }}>ผู้สมัครที่จะอยู่ในอีเมลรอบถัดไป ({pending.length} คน)</h3>
        <p style={{ ...hint, marginTop: 0, marginBottom: 12 }}>
          ใบสมัครที่ยื่นหลัง {thaiDateTime(settings?.lastWindowEnd || new Date(Date.now() - 86400000).toISOString())}
        </p>
        {pending.length === 0 ? (
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>ยังไม่มีผู้สมัครใหม่</div>
        ) : (
          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.88rem' }}>
            {pending.map(app => (
              <li key={app.id}>
                <strong>{app.fullName}</strong> <span style={{ color: 'var(--text-muted)' }}>({app.studentId})</span> — {app.scholarshipName}
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* ประวัติ */}
      <div style={card}>
        <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>ประวัติการทำงาน 10 ครั้งล่าสุด</h3>
        {logs.length === 0 ? (
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>ยังไม่มีประวัติ</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '6px 8px' }}>เวลา</th>
                  <th style={{ padding: '6px 8px' }}>ประเภท</th>
                  <th style={{ padding: '6px 8px' }}>ผล</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderTop: '1px solid var(--border-light, #e2e8f0)' }}>
                    <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{thaiDateTime(log.ranAt)}</td>
                    <td style={{ padding: '8px', whiteSpace: 'nowrap' }}>{log.kind === 'test' ? 'ทดสอบ' : 'ประจำวัน'}</td>
                    <td style={{ padding: '8px', color: log.sent ? '#047857' : 'var(--navy-700, #334155)' }}>
                      {log.sent ? '✓ ' : ''}{log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
