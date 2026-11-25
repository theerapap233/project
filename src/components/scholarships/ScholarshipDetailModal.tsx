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
  const isClosed = sch.status === 'closed';
  const isClosingSoon = sch.status === 'closing_soon';

  const handleApply = () => {
    if (isClosed) return;
    closeScholarshipDetail();
    openApplicationModal(sch.id);
  };

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeScholarshipDetail();
        }
      }}
    >
      <div className="modal-card">
        <div className="modal-header">
          <h3>{sch.title}</h3>
          <button
            type="button"
            className="modal-close-btn"
            onClick={closeScholarshipDetail}
            aria-label="ปิดหน้าต่าง"
          >
            &times;
          </button>
        </div>

        <div className="modal-body">
          {/* Metadata Badges (Scope, Category, Department - Code removed) */}
          <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className={`scope-badge ${sch.scope === 'external' ? 'external' : 'internal'}`}>
              {sch.scope === 'external' ? 'ทุนภายนอก' : 'ทุนภายใน'}
            </span>
            <span className="category-tag">{sch.categoryName}</span>
            <span className={`status-badge ${isClosed ? 'closed' : isClosingSoon ? 'closing_soon' : 'open'}`}>
              {isClosed ? 'ปิดรับสมัคร' : isClosingSoon ? 'ใกล้ปิดรับสมัคร' : 'เปิดรับสมัคร'}
            </span>
          </div>

          {/* Amount Box - Modern Clean Design (No orange, no dashed border) */}
          <div style={{
            background: 'var(--surface-ground)',
            border: '1px solid var(--border-light)',
            borderRadius: '16px',
            padding: '18px 20px',
            marginBottom: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              มูลค่าทุนสนับสนุน
            </span>
            <div style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              color: 'var(--math-green-dark, #055c29)',
              letterSpacing: '-0.02em'
            }}>
              {sch.amount}
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--navy-600)', marginTop: 2 }}>
              ประจำปีการศึกษา {sch.academicYear} ({sch.term})
            </div>
          </div>

          <h4 style={{ fontSize: '1rem', color: 'var(--navy-900)', marginBottom: 8, fontWeight: 700 }}>
            วัตถุประสงค์และรายละเอียดทุน
          </h4>
          <p style={{ color: 'var(--navy-700)', fontSize: '0.95rem', lineHeight: 1.75, marginBottom: 24 }}>
            {sch.description}
          </p>

          <h4 style={{ fontSize: '1rem', color: 'var(--navy-900)', marginBottom: 12, fontWeight: 700 }}>
            คุณสมบัติของผู้มีสิทธิ์สมัคร
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {sch.requirements.map((req, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.92rem', color: 'var(--navy-700)', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--math-green)', fontWeight: 700, lineHeight: 1.4, flexShrink: 0 }}>✓</span>
                <span>{req}</span>
              </div>
            ))}
          </div>

          <h4 style={{ fontSize: '1rem', color: 'var(--navy-900)', marginBottom: 12, fontWeight: 700 }}>
            เอกสารหลักฐานที่ต้องใช้ยื่น
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {sch.documents.map((doc, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.92rem', color: 'var(--navy-700)', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.2, flexShrink: 0 }}>•</span>
                <span>{doc}</span>
              </div>
            ))}
          </div>

          <div style={{ 
            background: 'var(--surface-alt)', 
            padding: '14px 18px', 
            borderRadius: '12px', 
            fontSize: '0.85rem', 
            color: 'var(--navy-600)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4
          }}>
            <strong style={{ color: 'var(--navy-800)' }}>แหล่งทุนสนับสนุน:</strong>
            <span>{sch.fundingSource}</span>
          </div>

          {sch.pdfUrl && (
            <div style={{ marginTop: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 10, flexWrap: 'wrap' }}>
                <h4 style={{ fontSize: '1rem', color: 'var(--navy-900)', margin: 0, fontWeight: 700 }}>
                  เอกสารประกาศทุนฉบับเต็ม (PDF)
                </h4>
                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={sch.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    เปิดเต็มจอ
                  </a>
                  <a
                    href={sch.pdfUrl}
                    download={sch.pdfName || `${sch.title}.pdf`}
                    className="btn btn-primary btn-sm"
                    style={{ textDecoration: 'none' }}
                  >
                    ดาวน์โหลด PDF
                  </a>
                </div>
              </div>
              <div style={{
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                overflow: 'hidden',
                background: '#f8fafc'
              }}>
                <iframe
                  src={sch.pdfUrl}
                  title={sch.pdfName || sch.title}
                  style={{ width: '100%', height: '460px', border: 'none', display: 'block' }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary" onClick={handleApply} disabled={isClosed}>
            {isClosed ? 'ปิดรับสมัครแล้ว' : 'สมัครทุนนี้'}
          </button>
        </div>
      </div>
    </div>
  );
};
