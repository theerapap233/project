import React from 'react';
import { useScholarship } from '../../context/ScholarshipContext';

export const LogoutModal: React.FC = () => {
  const { isLogoutModalOpen, closeLogoutModal, logout, currentUser } = useScholarship();

  if (!isLogoutModalOpen) return null;

  return (
    <div className="modal-backdrop open">
      <div className="modal-card" style={{ maxWidth: 440, borderRadius: '16px', overflow: 'hidden' }}>
        <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div style={{ textAlign: 'center', width: '100%', paddingTop: 8 }}>
            <div style={{ 
              width: 60, 
              height: 60, 
              borderRadius: '50%', 
              background: '#FEE2E2', 
              color: '#DC2626',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 14px',
              boxShadow: '0 4px 14px rgba(220, 38, 38, 0.2)' 
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.3rem', color: 'var(--navy-900, #0f172a)', margin: '0 0 6px', fontWeight: 700 }}>
              ยืนยันการออกจากระบบ
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748b)', margin: 0, lineHeight: 1.5 }}>
              คุณต้องการออกจากระบบเจ้าหน้าที่/ผู้ดูแลระบบ ใช่หรือไม่?
            </p>
          </div>
          <button className="modal-close-btn" onClick={closeLogoutModal}>&times;</button>
        </div>

        <div className="modal-body" style={{ padding: '20px 24px 16px' }}>
          {currentUser && (
            <div style={{
              background: 'var(--surface-ground, #f8fafc)',
              border: '1px solid var(--border-light, #e2e8f0)',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'var(--math-green, #077b38)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.95rem',
                flexShrink: 0
              }}>
                ⚙️
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-900, #0f172a)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
                  บัญชี: {currentUser.studentId} • ผู้ดูแลระบบ
                </div>
              </div>
            </div>
          )}

          <div style={{
            background: 'var(--warning-bg)',
            border: '1px solid #FDE68A',
            borderRadius: '8px',
            padding: '10px 14px',
            fontSize: '0.8rem',
            color: '#B45309',
            lineHeight: 1.5,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 8
          }}>
            <span style={{ fontSize: '1rem' }}>ℹ️</span>
            <span>
              เมื่อออกจากระบบแล้ว แดชบอร์ดและข้อมูลการพิจารณาทุนจะถูกซ่อนเพื่อความปลอดภัย
            </span>
          </div>
        </div>

        <div className="modal-footer" style={{ padding: '16px 24px 20px', background: 'var(--surface-ground, #f8fafc)', borderTop: '1px solid var(--border-light, #e2e8f0)', display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={closeLogoutModal}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            ยกเลิก
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={logout}
            style={{ 
              flex: 1, 
              justifyContent: 'center', 
              background: '#DC2626', 
              borderColor: '#DC2626',
              color: 'white',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
};
