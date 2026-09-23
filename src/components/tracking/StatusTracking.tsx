import React, { useState } from 'react';
import { useScholarship } from '../../context/ScholarshipContext';
import { formatThaiDate } from '../../utils/dateFormatter';

import { applicationService } from '../../services/applicationService';
import { isSupabaseConfigured } from '../../lib/supabase';

export const StatusTracking: React.FC = () => {
  const { applications, searchTrackingId, setSearchTrackingId, showToast } = useScholarship();
  const [query, setQuery] = useState(searchTrackingId);
  const [searchedApp, setSearchedApp] = useState(() => {
    return applications.find(a => 
      a.trackingId.toLowerCase() === searchTrackingId.toLowerCase() ||
      a.studentId.toLowerCase() === searchTrackingId.toLowerCase()
    ) || null;
  });
  const [hasSearched, setHasSearched] = useState(true);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = query.trim().toLowerCase();
    if (!clean) {
      showToast('กรุณากรอกรหัสนักศึกษา 13 หลัก', 'warning');
      return;
    }

    let found = applications.find(a => 
      a.trackingId.toLowerCase() === clean ||
      a.studentId.toLowerCase() === clean
    ) || null;

    if (!found && isSupabaseConfigured()) {
      const remoteApp = await applicationService.getApplicationByTrackingId(query.trim());
      if (remoteApp) {
        found = remoteApp;
      }
    }

    setSearchedApp(found);
    setHasSearched(true);
    setSearchTrackingId(clean);

    if (!found) {
      showToast(`ไม่พบข้อมูลสำหรับ "${clean}"`, 'warning');
    }
  };

  // Determine timeline step progression
  let currentStep = 1;
  let statusBadge = (
    <span className="status-badge" style={{ background: 'var(--info-bg)', color: 'var(--info)', border: '1px solid var(--info-border)' }}>
      ยื่นใบสมัครแล้ว
    </span>
  );

  if (searchedApp) {
    if (searchedApp.status === 'submitted') {
      currentStep = 1;
      statusBadge = (
        <span className="status-badge" style={{ background: 'var(--info-bg)', color: 'var(--info)', border: '1px solid var(--info-border)' }}>
          ยื่นใบสมัครแล้ว รอตรวจสอบเอกสาร
        </span>
      );
    } else if (searchedApp.status === 'doc_verified') {
      currentStep = 2;
      statusBadge = (
        <span className="status-badge" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', border: '1px solid var(--warning-border)' }}>
          เอกสารผ่านการตรวจสอบแล้ว
        </span>
      );
    } else if (searchedApp.status === 'interview_scheduled') {
      currentStep = 3;
      statusBadge = (
        <span className="status-badge" style={{ background: 'var(--purple-bg)', color: 'var(--purple)', border: '1px solid var(--purple-border)' }}>
          นัดหมายสัมภาษณ์
        </span>
      );
    } else if (searchedApp.status === 'approved') {
      currentStep = 5;
      statusBadge = (
        <span className="status-badge" style={{ background: 'var(--success-bg)', color: 'var(--success)', border: '1px solid var(--success-border)' }}>
          อนุมัติทุนการศึกษาเรียบร้อย
        </span>
      );
    } else if (searchedApp.status === 'rejected') {
      currentStep = 2;
      statusBadge = (
        <span className="status-badge" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger-border)' }}>
          ไม่ผ่านการคัดเลือก
        </span>
      );
    }
  }

  const stepsDef = searchedApp ? [
    { num: 1, title: 'ยื่นใบสมัคร', desc: formatThaiDate(searchedApp.submissionDate) },
    { num: 2, title: 'ตรวจสอบเอกสาร', desc: currentStep >= 2 ? 'เอกสารครบถ้วน' : 'รอดำเนินการ' },
    { num: 3, title: 'การสัมภาษณ์', desc: searchedApp.interviewDate || 'รอประกาศ' },
    { num: 4, title: 'ประกาศผลอนุมัติ', desc: searchedApp.status === 'approved' ? 'อนุมัติ' : 'รอพิจารณา' },
    { num: 5, title: 'ทำสัญญา & รับทุน', desc: searchedApp.status === 'approved' ? 'นัดหมายทำสัญญา' : '-' }
  ] : [];

  return (
    <section className="section" id="tracking">
      <div className="container" style={{ maxWidth: '1024px' }}>
        <div className="section-header">
          <span className="section-tag">Status Tracking</span>
          <h2 className="section-title">ตรวจสอบสถานะการสมัครขอรับทุน</h2>
          <p className="section-subtitle">ติดตามขั้นตอนการพิจารณาเอกสาร นัดหมายสัมภาษณ์ และผลการอนุมัติทุนแบบเรียลไทม์</p>
        </div>

        <div className="tracking-card">
          <form className="tracking-search-bar" onSubmit={handleSearch}>
            <input 
              type="text" 
              className="tracking-search-input" 
              placeholder="กรอกรหัสนักศึกษา 13 หลัก (เช่น 6504062630012)" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              ค้นหาสถานะ
            </button>
          </form>

          {hasSearched && !searchedApp && (
            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🔍</div>
              <h4 style={{ color: 'var(--navy-900)', marginBottom: 6 }}>ไม่พบข้อมูลใบสมัครสำหรับ: "{query}"</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: 480, margin: '0 auto' }}>
                กรุณาตรวจสอบรหัสนักศึกษา 13 หลักของท่านอีกครั้ง หรือติดต่อห้องธุรการภาควิชาคณิตศาสตร์
              </p>
            </div>
          )}

          {searchedApp && (
            <div>
              {/* Stepper Timeline */}
              <div className="status-timeline">
                {stepsDef.map(s => {
                  let stateClass = '';
                  if (s.num < currentStep) stateClass = 'completed';
                  if (s.num === currentStep) stateClass = 'active';

                  return (
                    <div key={s.num} className={`timeline-step ${stateClass}`}>
                      <div className="step-circle">{s.num < currentStep ? '✓' : s.num}</div>
                      <div className="step-name">{s.title}</div>
                      <div className="step-date">{s.desc}</div>
                    </div>
                  );
                })}
              </div>

              {/* Application Summary Box */}
              <div className="application-detail-card">
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'flex-start', 
                  marginBottom: 20, 
                  flexWrap: 'wrap', 
                  gap: 12 
                }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      รหัสนักศึกษา (Student ID)
                    </span>
                    <h3 style={{ fontFamily: 'var(--font-mono)', color: 'var(--kmutnb-orange)', fontSize: '1.5rem' }}>
                      {searchedApp.studentId}
                    </h3>
                  </div>
                  <div>{statusBadge}</div>
                </div>

                <div className="detail-row-grid">
                  <div>
                    <span className="detail-item-label">ชื่อผู้สมัคร</span>
                    <span className="detail-item-value">{searchedApp.fullName}</span>
                  </div>
                  <div>
                    <span className="detail-item-label">รหัสอ้างอิงใบสมัคร</span>
                    <span className="detail-item-value">{searchedApp.trackingId}</span>
                  </div>
                  <div>
                    <span className="detail-item-label">สาขาวิชา / ชั้นปี</span>
                    <span className="detail-item-value">{searchedApp.major} ({searchedApp.year})</span>
                  </div>
                  <div>
                    <span className="detail-item-label">ทุนการศึกษาที่สมัคร</span>
                    <span className="detail-item-value" style={{ color: 'var(--navy-900)', fontWeight: 700 }}>
                      {searchedApp.scholarshipName}
                    </span>
                  </div>
                  <div>
                    <span className="detail-item-label">เกรดเฉลี่ยสะสม (GPAX)</span>
                    <span className="detail-item-value">{searchedApp.gpax.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="detail-item-label">กำหนดการสัมภาษณ์</span>
                    <span className="detail-item-value" style={{ color: 'var(--kmutnb-orange)' }}>
                      {searchedApp.interviewDate || 'รอประกาศ'}
                    </span>
                  </div>
                  <div>
                    <span className="detail-item-label">บันทึกความเห็นคณะกรรมการ</span>
                    <span className="detail-item-value" style={{ fontSize: '0.88rem', color: 'var(--navy-700)' }}>
                      {searchedApp.committeeNotes || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
