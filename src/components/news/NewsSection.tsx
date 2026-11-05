import React, { useState } from 'react';
import { Announcement } from '../../types/common';
import { useScholarship } from '../../context/ScholarshipContext';

export const NewsSection: React.FC = () => {
  const { announcements, showToast } = useScholarship();
  const [selectedNews, setSelectedNews] = useState<Announcement | null>(null);

  const handleOpenNews = (news: Announcement) => {
    setSelectedNews(news);
  };

  const handleCloseNews = () => {
    setSelectedNews(null);
  };

  const handleDownloadDoc = (title: string) => {
    showToast(`กำลังเปิดเอกสาร: ${title}`, 'info');
  };

  return (
    <section className="section" id="news" style={{ padding: '60px 20px' }}>
      <div className="container news-container-card">
        {/* Top Decorative Border for the Frame */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '6px',
          background: 'var(--math-green, #10b981)'
        }} />

        <div className="section-header">
          <span className="section-tag">News & Announcements</span>
          <h2 className="section-title">ข่าวสารและประกาศทุนการศึกษา</h2>
          <p className="section-subtitle">
            ติดตามข่าวสารล่าสุด กำหนดการสัมภาษณ์ และผลการพิจารณาจัดสรรทุนของภาควิชาคณิตศาสตร์ มจพ.
          </p>
        </div>


        {/* News Grid - 3 Columns */}
        <div className="news-grid">
          {announcements.map(item => {
            let badgeBg = 'var(--math-green-soft)';
            let badgeColor = 'var(--math-green-dark)';
            let badgeBorder = 'var(--math-green-border)';

            if (item.tagType === 'warning') {
              badgeBg = 'var(--warning-bg)';
              badgeColor = 'var(--warning)';
              badgeBorder = 'var(--warning-border)';
            } else if (item.tag === 'ทุนนวัตกรรม') {
              badgeBg = 'rgba(232,78,15,0.1)';
              badgeColor = 'var(--kmutnb-orange)';
              badgeBorder = 'rgba(232,78,15,0.25)';
            }

            return (
              <div 
                key={item.id}
                className="scholarship-card"
                style={{ 
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}
                onClick={() => handleOpenNews(item)}
              >
                <div style={{ height: 4, background: item.tagType === 'warning' ? 'var(--warning)' : 'var(--math-green)' }} />
                <div className="card-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 8 }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 'var(--radius-full)',
                      background: badgeBg,
                      color: badgeColor,
                      border: `1px solid ${badgeBorder}`
                    }}>
                      {item.tag}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {item.date}
                    </span>
                  </div>

                  <h3 style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: 700, 
                    color: 'var(--navy-900)', 
                    marginBottom: 10, 
                    lineHeight: 1.45,
                    minHeight: '3.2rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.title}
                  </h3>

                  <p style={{ 
                    fontSize: '0.88rem', 
                    color: 'var(--navy-600)', 
                    lineHeight: 1.6, 
                    marginBottom: 20, 
                    flex: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '4.2rem'
                  }}>
                    {item.summary}
                  </p>

                  <div style={{
                    paddingTop: 14,
                    borderTop: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    color: 'var(--math-green)',
                    marginTop: 'auto'
                  }}>
                    <span>{item.linkText}</span>
                    <span style={{ fontSize: '1.1rem', transition: 'transform 0.2s ease' }}>&rarr;</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* News Detail Modal */}
        {selectedNews && (
          <div
            className="modal-backdrop open"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleCloseNews();
              }
            }}
          >
            <div className="modal-card">
              <div className="modal-header">
                <h3>{selectedNews.title}</h3>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={handleCloseNews}
                  aria-label="ปิดหน้าต่าง"
                >
                  &times;
                </button>
              </div>

              <div className="modal-body">
                <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="category-tag">
                    {selectedNews.tag}
                  </span>
                  <span
                    className="scope-badge internal"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {selectedNews.date}
                  </span>
                  <span className="status-badge open">
                    ภาควิชาคณิตศาสตร์
                  </span>
                </div>

                <h4 style={{ fontSize: '1rem', color: 'var(--navy-900)', marginBottom: 10, fontWeight: 700 }}>
                  รายละเอียดข่าวและประกาศ
                </h4>
                <p style={{ color: 'var(--navy-700)', fontSize: '0.95rem', lineHeight: 1.8, marginBottom: 24, whiteSpace: 'pre-line' }}>
                  {selectedNews.summary}
                </p>

                <div style={{ 
                  background: 'var(--surface-alt)', 
                  padding: '14px 18px', 
                  borderRadius: 'var(--radius-md)', 
                  fontSize: '0.85rem', 
                  color: 'var(--navy-600)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <strong style={{ color: 'var(--navy-800)' }}>ติดต่อสอบถามข้อมูลเพิ่มเติม:</strong>
                  <span>ห้องธุรการภาควิชาคณิตศาสตร์ ชั้น 7 อาคาร 78 มจพ. • โทร. 02-555-2000 ต่อ 4601-4602</span>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-primary" onClick={() => handleDownloadDoc(selectedNews.title)}>
                  ดาวน์โหลดประกาศ (PDF)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
