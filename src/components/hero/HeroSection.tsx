import React, { useMemo } from 'react';
import { useScholarship } from '../../context/ScholarshipContext';

export const HeroSection: React.FC = () => {
  const { scholarships, applications, scrollToSection } = useScholarship();

  const stats = useMemo(() => {
    const openCount = scholarships.filter(s => s.status === 'open' || s.status === 'closing_soon').length;
    const totalSlots = scholarships.reduce((sum, s) => sum + s.totalSlots, 0);
    const applicantCount = applications.length;
    return { openCount, totalSlots, applicantCount };
  }, [scholarships, applications]);

  return (
    <section className="hero-section" id="hero">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-badge">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              ปีการศึกษา 2567 ภาคการศึกษาที่ 1
            </div>
            <h1 className="hero-title">
              เปิดประตูสู่อนาคต<br />
              <span>ทุนการศึกษาคณิตศาสตร์</span> มจพ.
            </h1>
            <p className="hero-desc">
              ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มุ่งมั่นสนับสนุนศักยภาพทางวิชาการและช่วยเหลือนักศึกษาทุกระดับชั้น ทั้งทุนเรียนดี ทุนขาดแคลน ทุนผู้ช่วยสอน (TA) และทุนสนับสนุนงานวิจัย
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => scrollToSection('scholarships')}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                ค้นหาทุนที่เปิดรับ
              </button>
              <button className="btn btn-dark" onClick={() => scrollToSection('tracking')}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ติดตามผลการสมัคร
              </button>
            </div>
          </div>

          {/* Visual Live Stats Card */}
          <div className="hero-visual">
            <div className="math-glass-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                <img 
                  src="/logo.png" 
                  alt="ภาควิชาคณิตศาสตร์ มจพ." 
                  style={{ 
                    width: 64, 
                    height: 64, 
                    borderRadius: '50%', 
                    background: 'white', 
                    padding: 2, 
                    boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                    filter: 'drop-shadow(0 4px 12px rgba(11, 130, 53, 0.4))'
                  }} 
                />
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.8)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Department of Mathematics
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white' }}>
                    สถิติการจัดสรรทุนการศึกษา 2567
                  </div>
                </div>
              </div>

              <div className="hero-stats-grid">
                <div className="stat-box">
                  <div className="stat-icon" style={{ background: 'rgba(232,78,15,0.1)', color: 'var(--kmutnb-orange)' }}>
                    🎓
                  </div>
                  <div className="stat-num">{stats.openCount}</div>
                  <div className="stat-label">โครงการทุนที่เปิดรับ</div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>
                    💰
                  </div>
                  <div className="stat-num">1.2M+</div>
                  <div className="stat-label">งบประมาณสนับสนุน (บาท)</div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon" style={{ background: 'rgba(59,130,246,0.1)', color: 'var(--info)' }}>
                    👥
                  </div>
                  <div className="stat-num">{stats.totalSlots}</div>
                  <div className="stat-label">โควตาทุนทั้งหมด</div>
                </div>

                <div className="stat-box">
                  <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.1)', color: 'var(--warning)' }}>
                    ⚡
                  </div>
                  <div className="stat-num">{stats.applicantCount}</div>
                  <div className="stat-label">ผู้ยื่นสมัครในรอบนี้</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
