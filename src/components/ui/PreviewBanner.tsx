import React from 'react';
import { useScholarship } from '../../context/ScholarshipContext';

export const PreviewBanner: React.FC = () => {
  const { isPreviewMode, setIsPreviewMode } = useScholarship();

  if (!isPreviewMode) return null;

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 9999,
      background: 'linear-gradient(90deg, #1E293B, #0F172A)',
      color: 'white',
      padding: '8px 16px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      borderBottom: '2px solid var(--kmutnb-orange, #e65100)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 12,
      fontSize: '0.85rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{
          background: 'var(--kmutnb-orange, #e65100)',
          color: 'white',
          padding: '2px 8px',
          borderRadius: '4px',
          fontWeight: 700,
          fontSize: '0.72rem',
          letterSpacing: '0.5px'
        }}>
          PREVIEW MODE
        </span>
        <span style={{ fontWeight: 600 }}>
          👁️ โหมดดูตัวอย่างหน้าเว็บ (มุมมองนักศึกษา)
        </span>
        <span style={{ color: '#94A3B8', fontSize: '0.78rem' }}>
          • ข้อมูล ข่าวสาร และทุนการศึกษาอัปเดตตามที่คุณแก้ไขในระบบจัดการเว็บไซต์
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={() => {
            setIsPreviewMode(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="btn btn-sm"
          style={{
            background: 'var(--math-green, #077b38)',
            color: 'white',
            borderColor: 'var(--math-green, #077b38)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontWeight: 600,
            fontSize: '0.8rem',
            padding: '5px 12px'
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
          กลับสู่ระบบจัดการเว็บไซต์
        </button>

      </div>
    </div>
  );
};
