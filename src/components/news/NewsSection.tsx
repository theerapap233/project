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
    <section className="section news-section-minimal" id="news">
      <div className="container" style={{ maxWidth: '1024px' }}>
        <div className="section-header">
          <span className="section-tag-minimal">News & Announcements</span>
          <h2 className="section-title">ข่าวสารและประกาศทุนการศึกษา</h2>
          <p className="section-subtitle">
            ติดตามข่าวสารล่าสุด กำหนดการสัมภาษณ์ และผลการพิจารณาจัดสรรทุนของภาควิชาคณิตศาสตร์ มจพ.
          </p>
        </div>

        {/* News Grid - Minimalist 3 Columns */}
        <div className="news-grid-minimal">
          {announcements.map(item => (
            <article
              key={item.id}
              className="news-card-minimal"
              onClick={() => handleOpenNews(item)}
            >
              <div className="news-card-top">
                <span className="news-tag-pill">
                  {item.tag}
                </span>
                <time className="news-date">
                  <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {item.date}
                </time>
              </div>

              <h3 className="news-title">
                {item.title}
              </h3>

              <p className="news-summary">
                {item.summary}
              </p>

              <div className="news-footer">
                <span>{item.linkText || 'อ่านรายละเอียด'}</span>
                <span className="news-arrow">&rarr;</span>
              </div>
            </article>
          ))}
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
