import React from 'react';
import { useScholarship } from '../../context/ScholarshipContext';

export const ScholarshipDetailModal: React.FC = () => {
  const { 
    isDetailModalOpen, 
    selectedScholarshipForDetail, 
    closeScholarshipDetail, 
    openApplicationModal 
  } = useScholarship();

  if (!isDetailModalOpen || !selectedScholarshipForDetail) return null;

  const sch = selectedScholarshipForDetail;

  const handleApply = () => {
    closeScholarshipDetail();
    openApplicationModal(sch.id);
  };

  return (
    <div className="modal-backdrop open">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{sch.title}</h3>
          <button className="modal-close-btn" onClick={closeScholarshipDetail}>&times;</button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className={`scope-badge ${sch.scope === 'external' ? 'external' : 'internal'}`}>
              {sch.scope === 'external' ? '🌐 ทุนภายนอก' : '🏛️ ทุนภายใน'}
            </span>
            <span className="category-tag">{sch.categoryName}</span>
            <span 
              className={`status-badge ${sch.status === 'closing_soon' ? 'closing_soon' : 'open'}`} 
            >
              รหัสทุน: {sch.code}
            </span>
          </div>

          <div className="card-amount-box" style={{ marginBottom: 24 }}>
            <span className="amount-label">มูลค่าทุนและระยะเวลาสนับสนุน</span>
            <div className="amount-val">{sch.amount}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--navy-600)', marginTop: 4 }}>
              ประจำปีการศึกษา {sch.academicYear} ({sch.term})
            </div>
          </div>

          <h4 style={{ fontSize: '1rem', color: 'var(--navy-900)', marginBottom: 8 }}>
            วัตถุประสงค์และรายละเอียดทุน
          </h4>
          <p style={{ color: 'var(--navy-700)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: 20 }}>
            {sch.description}
          </p>

          <h4 style={{ fontSize: '1rem', color: 'var(--navy-900)', marginBottom: 10 }}>
            คุณสมบัติของผู้มีสิทธิ์สมัคร
          </h4>
          <ul style={{ paddingLeft: 20, color: 'var(--navy-700)', fontSize: '0.92rem', lineHeight: 1.8, marginBottom: 20 }}>
            {sch.requirements.map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>

          <h4 style={{ fontSize: '1rem', color: 'var(--navy-900)', marginBottom: 10 }}>
            เอกสารหลักฐานที่ต้องใช้ยื่น
          </h4>
          <ul style={{ paddingLeft: 20, color: 'var(--navy-700)', fontSize: '0.92rem', lineHeight: 1.8, marginBottom: 20 }}>
            {sch.documents.map((doc, idx) => (
              <li key={idx}>{doc}</li>
            ))}
          </ul>

          <div style={{ 
            background: 'var(--surface-alt)', 
            padding: '14px 18px', 
            borderRadius: 'var(--radius-md)', 
            fontSize: '0.85rem', 
            color: 'var(--navy-600)' 
          }}>
            <strong>แหล่งทุนสนับสนุน:</strong> {sch.fundingSource}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={closeScholarshipDetail}>
            ปิดหน้าต่าง
          </button>
          <button className="btn btn-primary" onClick={handleApply}>
            สมัครทุนนี้
          </button>
        </div>
      </div>
    </div>
  );
};
