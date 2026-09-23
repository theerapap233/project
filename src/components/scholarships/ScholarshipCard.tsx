import React from 'react';
import { Scholarship } from '../../types/scholarship';
import { formatThaiDate } from '../../utils/dateFormatter';
import { useScholarship } from '../../context/ScholarshipContext';

interface ScholarshipCardProps {
  scholarship: Scholarship;
}

export const ScholarshipCard: React.FC<ScholarshipCardProps> = ({ scholarship }) => {
  const { openScholarshipDetail, openApplicationModal } = useScholarship();



  return (
    <div className="scholarship-card">
      <div className={`card-top-bar ${scholarship.badgeColor}`} />
      <div className="card-content">


        <h3 className="card-title">{scholarship.title}</h3>

        <div className="card-amount-box">
          <span className="amount-label">มูลค่าทุนสนับสนุน</span>
          <div className="amount-val">{scholarship.amount}</div>
        </div>

        <ul className="card-criteria-list">
          <li>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>เกรดเฉลี่ยสะสม (GPAX) ไม่ต่ำกว่า <strong>{scholarship.minGPAX.toFixed(2)}</strong></span>
          </li>
          <li>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>สำหรับ: {scholarship.targetYears.join(', ')}</span>
          </li>
          <li>
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>จำนวนโควตาที่เปิดรับ: <strong>{scholarship.totalSlots} ทุน</strong> (คงเหลือ {scholarship.remainingSlots} ทุน)</span>
          </li>
        </ul>

        <div className="card-footer">
          <div className="deadline-text">
            ปิดรับสมัคร: <strong>{formatThaiDate(scholarship.deadline)}</strong>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => openScholarshipDetail(scholarship)}
            >
              รายละเอียด
            </button>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={() => openApplicationModal(scholarship.id)}
            >
              สมัครทุน
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
