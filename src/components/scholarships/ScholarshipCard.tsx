import React from 'react';
import { Scholarship } from '../../types/scholarship';
import { formatThaiDate } from '../../utils/dateFormatter';
import { useScholarship } from '../../context/ScholarshipContext';
import { useMyApplications } from '../../hooks/useMyApplications';
import { STATUS_META } from '../../utils/applicationStatus';

interface ScholarshipCardProps {
  scholarship: Scholarship;
}

export const ScholarshipCard: React.FC<ScholarshipCardProps> = ({ scholarship }) => {
  const { openScholarshipDetail, openApplicationModal, openMyApplications } = useScholarship();
  const { findByScholarship } = useMyApplications();
  const myApplication = findByScholarship(scholarship.id);
  const myStatus = myApplication ? (STATUS_META[myApplication.status] ?? STATUS_META.submitted) : null;

  const isClosed = scholarship.status === 'closed';
  const isClosing = scholarship.status === 'closing_soon';

  return (
    <div
      className="scholarship-card-minimal"
      style={myStatus ? { borderColor: myStatus.border, boxShadow: `0 0 0 1px ${myStatus.border}` } : undefined}
    >
      {myStatus && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            margin: '-4px 0 12px',
            padding: '6px 10px',
            borderRadius: 8,
            background: myStatus.bg,
            color: myStatus.color,
            fontSize: '0.78rem',
            fontWeight: 700
          }}
        >
          <span aria-hidden="true">✓</span>
          <span>คุณสมัครทุนนี้แล้ว · {myStatus.label}</span>
        </div>
      )}
      <div className="card-top-meta">
        <span className={`card-status-dot ${isClosed ? 'closed' : isClosing ? 'closing' : 'open'}`}>
          {isClosed ? 'ปิดรับแล้ว' : isClosing ? 'ใกล้ปิดรับ' : 'เปิดรับสมัคร'}
        </span>
      </div>

      <h3 className="card-title-minimal" title={scholarship.title}>
        {scholarship.title}
      </h3>

      <div className="card-amount-clean">
        <span className="amount-label">มูลค่าทุน</span>
        <div className="amount-val">{scholarship.amount}</div>
      </div>

      <div className="card-footer-clean">
        <div className="card-deadline-text">
          <span>ปิดรับ:</span> <strong>{scholarship.deadline ? formatThaiDate(scholarship.deadline) : 'ตามประกาศ'}</strong>
        </div>
        <div className="card-btns">
          <button
            type="button"
            className="btn-card-detail"
            onClick={() => openScholarshipDetail(scholarship)}
          >
            รายละเอียด
          </button>
          {myStatus ? (
            /* สมัครทุนนี้แล้ว: แสดงสถานะแทนปุ่มสมัคร เพื่อกันการสมัครซ้ำ */
            <button
              type="button"
              className="btn-card-apply"
              onClick={openMyApplications}
              title="ดูสถานะใบสมัครของคุณ"
              style={{ background: myStatus.bg, color: myStatus.color, border: `1px solid ${myStatus.border}`, boxShadow: 'none' }}
            >
              ✓ สมัครแล้ว · {myStatus.short}
            </button>
          ) : (
            <button
              type="button"
              className="btn-card-apply"
              onClick={() => openApplicationModal(scholarship.id)}
              disabled={isClosed}
              style={isClosed ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
            >
              {isClosed ? 'ปิดรับ' : 'สมัครทุน'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
