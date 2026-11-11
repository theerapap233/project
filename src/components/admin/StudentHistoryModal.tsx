import React, { useEffect, useMemo } from 'react';
import { Application } from '../../types/application';
import { formatThaiDate } from '../../utils/dateFormatter';
import { STATUS_META } from '../../utils/applicationStatus';
import { normalizeStudentId } from '../../hooks/useMyApplications';

interface StudentHistoryModalProps {
  studentId: string | null;
  applications: Application[];
  onClose: () => void;
  onOpenApplication: (app: Application) => void;
}

const thaiYearOf = (date: string) => {
  const y = parseInt((date || '').slice(0, 4), 10);
  return Number.isFinite(y) ? String(y + 543) : 'ไม่ระบุปี';
};

const formatMoney = (value: number) =>
  value > 0 ? `${value.toLocaleString('th-TH')} บาท/ปี` : '-';

/** ประวัติการสมัครทุนทั้งหมดของนักศึกษาหนึ่งคน (สำหรับอาจารย์/เจ้าหน้าที่) */
export const StudentHistoryModal: React.FC<StudentHistoryModalProps> = ({
  studentId,
  applications,
  onClose,
  onOpenApplication
}) => {
  const history = useMemo(() => {
    if (!studentId) return [];
    const id = normalizeStudentId(studentId);
    return applications
      .filter(app => normalizeStudentId(app.studentId) === id)
      .sort((a, b) => (b.submissionDate || '').localeCompare(a.submissionDate || ''));
  }, [applications, studentId]);

  useEffect(() => {
    if (!studentId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [studentId, onClose]);

  if (!studentId || history.length === 0) return null;

  const latest = history[0];
  const counts = {
    total: history.length,
    approved: history.filter(a => a.status === 'approved').length,
    submitted: history.filter(a => a.status === 'submitted').length,
    rejected: history.filter(a => a.status === 'rejected').length
  };

  // จัดกลุ่มตามปี (พ.ศ.) ที่ยื่น
  const groups: { year: string; apps: Application[] }[] = [];
  history.forEach(app => {
    const year = thaiYearOf(app.submissionDate);
    const group = groups.find(g => g.year === year);
    if (group) group.apps.push(app);
    else groups.push({ year, apps: [app] });
  });

  const infoRows: { label: string; value: React.ReactNode }[] = [
    { label: 'สาขา / ชั้นปี', value: `${latest.major || '-'} · ${latest.year || '-'}` },
    { label: 'GPAX ล่าสุด', value: Number.isFinite(latest.gpax) ? latest.gpax.toFixed(2) : '-' },
    { label: 'รายได้ครอบครัว', value: formatMoney(latest.familyIncome) },
    { label: 'โทรศัพท์', value: latest.phone || '-' },
    { label: 'อีเมล', value: latest.email || '-' }
  ];

  const summary = [
    { label: 'สมัครทั้งหมด', value: counts.total, color: 'var(--navy-900, #0f172a)' },
    { label: 'ได้รับทุน', value: counts.approved, color: STATUS_META.approved.color },
    { label: 'รอพิจารณา', value: counts.submitted, color: STATUS_META.submitted.color },
    { label: 'ไม่ผ่าน', value: counts.rejected, color: STATUS_META.rejected.color }
  ];

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="student-history-title" style={{ maxWidth: 780 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
            {latest.profilePhoto ? (
              <img
                src={latest.profilePhoto}
                alt={`รูปของ ${latest.fullName}`}
                style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div
                aria-hidden="true"
                style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(7, 123, 56, 0.12)', color: 'var(--math-green, #077b38)', fontWeight: 700, fontSize: '1.3rem' }}
              >
                {(latest.fullName || '?').replace(/^(นาย|นางสาว|นาง)\s*/, '').charAt(0)}
              </div>
            )}
            <div style={{ minWidth: 0 }}>
              <h3 id="student-history-title" style={{ margin: 0 }}>ประวัติการสมัครทุน</h3>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
                <strong style={{ color: 'var(--navy-900, #0f172a)' }}>{latest.fullName}</strong> · รหัส {latest.studentId}
              </div>
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="ปิดหน้าต่าง">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* สรุปจำนวน */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 16 }}>
            {summary.map(item => (
              <div
                key={item.label}
                style={{ padding: '10px 12px', borderRadius: 12, background: 'var(--surface-ground, #f8fafc)', border: '1px solid var(--border-light, #e2e8f0)', minWidth: 0 }}
              >
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: item.color, lineHeight: 1.3 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* ข้อมูลนักศึกษา (จากใบสมัครล่าสุด) */}
          <div style={{ border: '1px solid var(--border-light, #e2e8f0)', borderRadius: 12, padding: '12px 16px', marginBottom: 18 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted, #64748b)', marginBottom: 8 }}>
              ข้อมูลนักศึกษา (จากใบสมัครล่าสุด {formatThaiDate(latest.submissionDate)})
            </div>
            <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px 20px', margin: 0 }}>
              {infoRows.map(row => (
                <div key={row.label} style={{ minWidth: 0 }}>
                  <dt style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748b)' }}>{row.label}</dt>
                  <dd style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-900, #0f172a)', overflowWrap: 'anywhere' }}>{row.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* รายการใบสมัคร จัดกลุ่มตามปี */}
          {groups.map(group => (
            <section key={group.year} style={{ marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 8px', fontSize: '0.86rem', color: 'var(--navy-800, #1e293b)' }}>
                ปี {group.year} <span style={{ fontWeight: 500, color: 'var(--text-muted, #64748b)' }}>({group.apps.length} ใบสมัคร)</span>
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {group.apps.map(app => {
                  const meta = STATUS_META[app.status] ?? STATUS_META.submitted;
                  return (
                    <div
                      key={app.trackingId}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '12px 14px', borderRadius: 12, border: '1px solid var(--border-light, #e2e8f0)', borderLeft: `4px solid ${meta.color}`, background: 'var(--surface-card, #ffffff)' }}
                    >
                      <div style={{ flex: '1 1 280px', minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--navy-900, #0f172a)', lineHeight: 1.45 }}>
                          {app.scholarshipName}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted, #64748b)', marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          <span>ยื่น {formatThaiDate(app.submissionDate)}</span>
                          <span>GPAX ตอนสมัคร {app.gpax.toFixed(2)}</span>
                          {app.score !== null && app.score !== undefined && <span>คะแนน {app.score}</span>}
                        </div>
                        {app.committeeNotes && (
                          <div style={{ fontSize: '0.76rem', color: 'var(--navy-700, #334155)', marginTop: 4 }}>
                            บันทึกกรรมการ: {app.committeeNotes}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, padding: '4px 10px', borderRadius: 999, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`, whiteSpace: 'nowrap' }}>
                        {meta.label}
                      </span>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onOpenApplication(app)}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        ดูใบสมัคร
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
