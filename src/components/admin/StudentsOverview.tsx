import React, { useMemo } from 'react';
import { Application } from '../../types/application';
import { formatThaiDate } from '../../utils/dateFormatter';
import { STATUS_META } from '../../utils/applicationStatus';
import { normalizeStudentId } from '../../utils/studentId';

interface StudentsOverviewProps {
  /** ใบสมัครที่ผ่านตัวกรอง/คำค้นหา ใช้กำหนดว่าจะแสดงนักศึกษาคนไหน */
  filteredApps: Application[];
  /** ใบสมัครทั้งหมด ใช้แสดงทุนทุกรายการของนักศึกษาแต่ละคน */
  applications: Application[];
  onOpenHistory: (studentId: string) => void;
  onOpenApplication: (app: Application) => void;
}

interface StudentGroup {
  key: string;
  latest: Application;
  apps: Application[];
}

/** มุมมองรายนักศึกษา: หนึ่งแถวต่อหนึ่งคน พร้อมรายการทุนที่คนนั้นสมัครไปแล้วทั้งหมด */
export const StudentsOverview: React.FC<StudentsOverviewProps> = ({
  filteredApps,
  applications,
  onOpenHistory,
  onOpenApplication
}) => {
  const students = useMemo<StudentGroup[]>(() => {
    const visible = new Set(filteredApps.map(app => normalizeStudentId(app.studentId)));
    const map = new Map<string, Application[]>();
    applications.forEach(app => {
      const key = normalizeStudentId(app.studentId);
      if (!visible.has(key)) return;
      const list = map.get(key) || [];
      list.push(app);
      map.set(key, list);
    });
    return Array.from(map.entries())
      .map(([key, apps]) => {
        const sorted = [...apps].sort((a, b) => (b.submissionDate || '').localeCompare(a.submissionDate || ''));
        return { key, latest: sorted[0], apps: sorted };
      })
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [filteredApps, applications]);

  if (students.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)', fontSize: '0.9rem', background: 'var(--surface-card)', borderRadius: 12, border: '1px solid var(--border-light, #e2e8f0)' }}>
        ไม่พบนักศึกษาที่ตรงกับเงื่อนไขการค้นหา
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', margin: '0 4px 10px' }}>
        นักศึกษา {students.length} คน · กดที่ทุนเพื่อเปิดใบสมัคร หรือกด “ดูประวัติ” เพื่อดูรายละเอียดทั้งหมดของคนนั้น
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {students.map(({ key, latest, apps }) => {
          const approved = apps.filter(a => a.status === 'approved').length;
          const initial = (latest.fullName || '?').replace(/^(นาย|นางสาว|นาง)\s*/, '').trim().charAt(0) || '?';
          return (
            <article
              key={key}
              style={{ background: 'var(--surface-card, #ffffff)', border: '1px solid var(--border-light, #e2e8f0)', borderRadius: 14, padding: '14px 16px' }}
            >
              {/* หัวการ์ด: ข้อมูลนักศึกษา */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {latest.profilePhoto ? (
                  <img
                    src={latest.profilePhoto}
                    alt={`รูปของ ${latest.fullName}`}
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(7, 123, 56, 0.12)', color: 'var(--math-green, #077b38)', fontWeight: 700, fontSize: '1.1rem' }}
                  >
                    {initial}
                  </div>
                )}
                <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: 'var(--navy-900, #0f172a)', lineHeight: 1.35 }}>{latest.fullName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
                    {latest.studentId} · {latest.major || '-'} · {latest.year || '-'} · GPAX {Number.isFinite(latest.gpax) ? latest.gpax.toFixed(2) : '-'}
                  </div>
                </div>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe', whiteSpace: 'nowrap' }}>
                  สมัคร {apps.length} ทุน{approved > 0 ? ` · ได้ทุน ${approved}` : ''}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onOpenHistory(latest.studentId)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  ดูประวัติ
                </button>
              </div>

              {/* รายการทุนที่สมัครไปแล้ว */}
              <ul style={{ listStyle: 'none', margin: '12px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {apps.map(app => {
                  const meta = STATUS_META[app.status] ?? STATUS_META.submitted;
                  return (
                    <li key={app.trackingId}>
                      <button
                        type="button"
                        onClick={() => onOpenApplication(app)}
                        title="เปิดใบสมัครนี้"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-light, #e2e8f0)', borderLeft: `4px solid ${meta.color}`, background: 'var(--surface-ground, #f8fafc)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                      >
                        <span style={{ flex: '1 1 260px', minWidth: 0, fontSize: '0.86rem', fontWeight: 600, color: 'var(--navy-900, #0f172a)', lineHeight: 1.4 }}>
                          {app.scholarshipName}
                        </span>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap' }}>
                          ยื่น {formatThaiDate(app.submissionDate)}
                        </span>
                        <span style={{ fontSize: '0.74rem', fontWeight: 700, padding: '2px 10px', borderRadius: 999, color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`, whiteSpace: 'nowrap' }}>
                          {meta.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </article>
          );
        })}
      </div>
    </div>
  );
};
