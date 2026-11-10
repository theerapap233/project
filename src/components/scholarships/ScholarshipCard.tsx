import React from 'react';
import { Scholarship } from '../../types/scholarship';
import { formatThaiDate } from '../../utils/dateFormatter';
import { useScholarship } from '../../context/ScholarshipContext';

interface ScholarshipCardProps {
  scholarship: Scholarship;
}

export const ScholarshipCard: React.FC<ScholarshipCardProps> = ({ scholarship }) => {
  const { openScholarshipDetail, openApplicationModal } = useScholarship();

  const isClosed = scholarship.status === 'closed';
  const isClosing = scholarship.status === 'closing_soon';

  return (
    <div className="scholarship-card-minimal">
      <div className="card-top-meta">
        <span className="card-category-pill">
          {scholarship.categoryName || (scholarship.scope === 'internal' ? 'ทุนภายใน' : 'ทุนภายนอก')}
        </span>
        <span className={`card-status-dot ${isClosed ? 'closed' : isClosing ? 'closing' : 'open'}`}>
          {isClosed ? 'ปิดรับแล้ว' : isClosing ? 'ใกล้ปิดรับ' : 'เปิดรับสมัคร'}
        </span>
      </div>

      <h3 className="card-title-minimal" title={scholarship.title}>
        {scholarship.title}
      </h3>

      <div className="card-amount-clean">
        <span className="amount-label">มูลค่าทุนสนับสนุน</span>
        <div className="amount-val">{scholarship.amount}</div>
      </div>

      <ul className="card-criteria-clean">
        <li>
          <span>เกรดขั้นต่ำ: <strong>GPAX ≥ {(typeof scholarship.minGPAX === 'number' ? scholarship.minGPAX : 2.0).toFixed(2)}</strong></span>
        </li>
        <li>
          <span>กลุ่มเป้าหมาย: <strong>{(Array.isArray(scholarship.targetYears) && scholarship.targetYears.length > 0 ? scholarship.targetYears : ['ทุกชั้นปี']).join(', ')}</strong></span>
        </li>
        <li>
          <span>จำนวนโควตา: <strong>{scholarship.totalSlots ?? 0} ทุน</strong></span>
        </li>
      </ul>

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
          <button
            type="button"
            className="btn-card-apply"
            onClick={() => openApplicationModal(scholarship.id)}
            disabled={isClosed}
            style={isClosed ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
          >
            {isClosed ? 'ปิดรับ' : 'สมัครทุน'}
          </button>
        </div>
      </div>
    </div>
  );
};
