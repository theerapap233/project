import React from 'react';
import { useScholarship } from '../../context/ScholarshipContext';

export const ApplicationSuccessModal: React.FC = () => {
  const { 
    isSuccessModalOpen, 
    closeSuccessModal, 
    latestTrackingId, 
    scrollToSection 
  } = useScholarship();

  if (!isSuccessModalOpen) return null;

  const handleGoToTracking = () => {
    closeSuccessModal();
    scrollToSection('tracking');
  };

  return (
    <div className="modal-backdrop open">
      <div className="modal-card" style={{ maxWidth: 580, textAlign: 'center' }}>
        <div className="modal-header" style={{ justifyContent: 'center', border: 'none', paddingBottom: 0 }}>
          <div style={{
            width: 60,
            height: 60,
            background: 'var(--success-bg)',
            border: '2px solid var(--success-border)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--success)',
            fontSize: 28,
            margin: '0 auto'
          }}>
            ✓
          </div>
        </div>

        <div className="modal-body">
          <h3 style={{ color: 'var(--navy-900)', fontSize: '1.4rem', marginBottom: 8 }}>
            ยื่นใบสมัครสำเร็จเรียบร้อย!
          </h3>
          <p style={{ color: 'var(--navy-600)', fontSize: '0.95rem', marginBottom: 24 }}>
            ระบบได้รับข้อมูลการสมัครของท่านแล้ว สามารถใช้รหัสติดตามเพื่อตรวจสอบผลได้ตลอดเวลา
          </p>

          <div style={{
            background: 'var(--surface-ground)',
            border: '2px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            padding: 20,
            marginBottom: 24
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              รหัสติดตามใบสมัคร (Tracking ID)
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--kmutnb-orange)',
              letterSpacing: '0.05em',
              margin: '6px 0'
            }}>
              {latestTrackingId}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--navy-700)' }}>
              กรุณาจดบันทึกหรือถ่ายภาพรหัสนี้ไว้เพื่อใช้ตรวจสอบสถานะ
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => window.print()}>
              🖨️ พิมพ์ใบเสร็จรับสมัคร
            </button>
            <button className="btn btn-primary" onClick={handleGoToTracking}>
              🔍 ติดตามสถานะตอนนี้
            </button>
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-sm" onClick={closeSuccessModal}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
