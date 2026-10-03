import React from 'react';
import { useScholarship } from '../../context/ScholarshipContext';
import { LogOut } from 'lucide-react';

export const LogoutModal: React.FC = () => {
  const { isLogoutModalOpen, closeLogoutModal, logout } = useScholarship();

  if (!isLogoutModalOpen) return null;

  return (
    <div className="modal-backdrop open" onClick={closeLogoutModal}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: 360, 
          borderRadius: '16px', 
          padding: '28px 24px 22px', 
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.12)',
          border: '1px solid var(--border-light, #e2e8f0)',
          background: 'var(--surface-card, #ffffff)'
        }}
      >
        <div style={{ 
          width: 48, 
          height: 48, 
          borderRadius: '50%', 
          background: '#fef2f2', 
          color: '#dc2626',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 16px',
          border: '1px solid #fee2e2'
        }}>
          <LogOut size={22} strokeWidth={2} />
        </div>

        <h3 style={{ fontSize: '1.25rem', color: 'var(--navy-900, #0f172a)', margin: '0 0 8px', fontWeight: 700 }}>
          ยืนยันการออกจากระบบ
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted, #64748b)', margin: '0 0 24px', lineHeight: 1.5 }}>
          คุณต้องการออกจากระบบ ใช่หรือไม่?
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={closeLogoutModal}
            style={{ 
              flex: 1, 
              justifyContent: 'center', 
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              border: '1px solid var(--border-light, #e2e8f0)'
            }}
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
              background: '#dc2626', 
              borderColor: '#dc2626',
              color: '#ffffff',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '0.88rem',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.25)'
            }}
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
};
