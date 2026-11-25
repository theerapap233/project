import React, { useState } from 'react';
import { Announcement } from '../../types/common';
import { useScholarship } from '../../context/ScholarshipContext';

export const NewsSection: React.FC = () => {
  const { announcements } = useScholarship();
  const [selectedNews, setSelectedNews] = useState<Announcement | null>(null);
  const [showAllNews, setShowAllNews] = useState(false);
  const visibleAnnouncements = showAllNews ? announcements : announcements.slice(0, 3);

  const handleOpenNews = (news: Announcement) => {
    setSelectedNews(news);
  };

  const handleCloseNews = () => {
    setSelectedNews(null);
  };

  return (
    <section className="section news-section-minimal" id="news">
      <div className="container" style={{ maxWidth: '1024px' }}>
        <div className="section-header">
          <span className="section-tag-minimal">News &amp; Announcements</span>
          <h2 className="section-title">ข่าวสาร</h2>
        </div>

        {/* News Grid - Minimalist 3 Columns */}
        {visibleAnnouncements.length > 0 ? (
          <div className="news-grid-minimal">
            {visibleAnnouncements.map(item => (
              <article
                key={item.id}
                className="news-card-minimal"
                role="button"
                tabIndex={0}
                aria-label={`อ่านข่าว ${item.title}`}
                onClick={() => handleOpenNews(item)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleOpenNews(item);
                  }
                }}
              >
                <div className="news-card-top">
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
        ) : (
          <p className="section-subtitle">ขณะนี้ยังไม่มีข่าวสารและประกาศ</p>
        )}
        {announcements.length > 3 && (
          <button
            type="button"
            className="section-view-more"
            aria-expanded={showAllNews}
            onClick={() => setShowAllNews(showAll => !showAll)}
          >
            {showAllNews ? 'ย่อรายการ' : 'ดูเพิ่มเติม'}
          </button>
        )}

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
                  {selectedNews.summary || 'ยังไม่มีรายละเอียดเพิ่มเติม'}
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

            </div>
          </div>
        )}
      </div>
    </section>
  );
};
