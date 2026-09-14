import React, { useState, useMemo } from 'react';
import { ANNOUNCEMENTS } from '../../data/staticContent';
import { Announcement } from '../../types/common';
import { useScholarship } from '../../context/ScholarshipContext';

export const NewsSection: React.FC = () => {
  const { showToast } = useScholarship();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [selectedNews, setSelectedNews] = useState<Announcement | null>(null);

  const filterCategories = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'ประกาศสำคัญ', label: 'ประกาศสำคัญ' },
    { key: 'นัดสัมภาษณ์', label: 'นัดสัมภาษณ์' },
    { key: 'ผลการพิจารณา', label: 'ผลการพิจารณา' },
    { key: 'ข่าวกิจกรรม', label: 'ข่าวกิจกรรม' }
  ];

  const filteredNews = useMemo(() => {
    if (activeFilter === 'all') return ANNOUNCEMENTS;
    return ANNOUNCEMENTS.filter(item => item.tag === activeFilter);
  }, [activeFilter]);

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
    <section className="section" id="news" style={{ background: 'var(--surface-alt)' }}>
      <div className="container">
        <div className="section-header">
          <span className="section-tag">News & Announcements</span>
          <h2 className="section-title">ข่าวสารและประกาศทุนการศึกษา</h2>
          <p className="section-subtitle">
            ติดตามข่าวสารล่าสุด กำหนดการสัมภาษณ์ และผลการพิจารณาจัดสรรทุนของภาควิชาคณิตศาสตร์ มจพ.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 36 }}>
          {filterCategories.map(cat => (
            <button
              key={cat.key}
              className={`filter-btn ${activeFilter === cat.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* News Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: 24
        }}>
          {filteredNews.map(item => {
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
                style={{ cursor: 'pointer' }}
                onClick={() => handleOpenNews(item)}
              >
                <div style={{ height: 4, background: item.tagType === 'warning' ? 'var(--warning)' : 'var(--math-green)' }} />
                <div className="card-content">
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

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: 10, lineHeight: 1.4 }}>
                    {item.title}
                  </h3>

                  <p style={{ fontSize: '0.9rem', color: 'var(--navy-600)', lineHeight: 1.6, marginBottom: 20, flex: 1 }}>
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
                    color: 'var(--math-green)'
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
          <div className="modal-backdrop open">
            <div className="modal-card" style={{ maxWidth: 620 }}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--math-green-soft)',
                    color: 'var(--math-green-dark)'
                  }}>
                    {selectedNews.tag}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    📅 {selectedNews.date}
                  </span>
                </div>
                <button className="modal-close-btn" onClick={handleCloseNews}>&times;</button>
              </div>

              <div className="modal-body">
                <h3 style={{ fontSize: '1.3rem', color: 'var(--navy-900)', marginBottom: 16, lineHeight: 1.4 }}>
                  {selectedNews.title}
                </h3>
                
                <p style={{ fontSize: '0.98rem', color: 'var(--navy-700)', lineHeight: 1.8, marginBottom: 20 }}>
                  {selectedNews.summary}
                </p>

                <div style={{
                  background: 'var(--surface-ground)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: 16
                }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 6 }}>
                    ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มจพ.
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                    หากมีข้อสงสัยหรือต้องการสอบถามข้อมูลเพิ่มเติม สามารถติดต่อห้องธุรการภาควิชาคณิตศาสตร์ ชั้น 7 อาคาร 78 หรือโทร. 02-555-2000 ต่อ 4601-4602
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleCloseNews}>
                  ปิดหน้าต่าง
                </button>
                <button className="btn btn-primary" onClick={() => handleDownloadDoc(selectedNews.title)}>
                  ดาวน์โหลดเอกสารประกาศ (PDF)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
