import React from 'react';
import { useScholarship } from '../../context/ScholarshipContext';
import { useMyApplications } from '../../hooks/useMyApplications';
import { STATUS_META } from '../../utils/applicationStatus';

/** แถบสรุปสถานะใบสมัคร แสดงบนหน้าแรกเมื่อนักศึกษาล็อกอินและมีใบสมัครอย่างน้อย 1 ใบ */
export const MyApplicationsBanner: React.FC = () => {
  const { openMyApplications } = useScholarship();
  const { isStudent, counts } = useMyApplications();

  if (!isStudent || counts.total === 0) return null;

  const parts = [
    counts.submitted > 0 && { text: `รอพิจารณา ${counts.submitted}`, color: STATUS_META.submitted.color },
    counts.approved > 0 && { text: `อนุมัติแล้ว ${counts.approved}`, color: STATUS_META.approved.color },
    counts.rejected > 0 && { text: `ไม่ผ่าน ${counts.rejected}`, color: STATUS_META.rejected.color }
  ].filter(Boolean) as { text: string; color: string }[];

  return (
    <div className="container" style={{ maxWidth: 1024, padding: '0 16px', marginTop: 16 }}>
      <button
        type="button"
        onClick={openMyApplications}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          padding: '12px 18px',
          borderRadius: 14,
          border: '1px solid rgba(7, 123, 56, 0.25)',
          background: 'rgba(7, 123, 56, 0.06)',
          cursor: 'pointer',
          textAlign: 'left',
          font: 'inherit',
          color: 'var(--text-main, #0f172a)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span aria-hidden="true">📋</span>
          <strong style={{ fontSize: '0.92rem' }}>คุณมีใบสมัคร {counts.total} ใบ</strong>
          {parts.map(part => (
            <span key={part.text} style={{ fontSize: '0.84rem', fontWeight: 600, color: part.color }}>
              · {part.text}
            </span>
          ))}
        </span>
        <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--math-green, #077b38)' }}>
          ดูสถานะใบสมัคร →
        </span>
      </button>
    </div>
  );
};
