import React, { useState } from 'react';
import { DOWNLOAD_FORMS, FAQ_LIST } from '../../data/staticContent';
import { useScholarship } from '../../context/ScholarshipContext';

export const DownloadsFaqSection: React.FC = () => {
  const { showToast } = useScholarship();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(prev => (prev === index ? null : index));
  };

  const handleDownload = (title: string) => {
    showToast(`กำลังดาวน์โหลด: ${title}`, 'info');
    setTimeout(() => {
      showToast(`ดาวน์โหลดเอกสาร "${title}" เรียบร้อยแล้ว`, 'success');
    }, 800);
  };

  return (
    <section className="section" id="downloads">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Downloads & Help</span>
          <h2 className="section-title">แบบฟอร์มเอกสารและคำถามที่พบบ่อย</h2>
          <p className="section-subtitle">ดาวน์โหลดแบบฟอร์มทางการ และค้นหาคำตอบสำหรับข้อสงสัยในการขอรับทุนการศึกษา</p>
        </div>

        {/* Download Cards */}
        <div className="download-grid">
          {DOWNLOAD_FORMS.map(doc => (
            <div key={doc.id} className="download-card">
              <div className="doc-icon-box">
                {doc.type}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--navy-900)', marginBottom: 4 }}>
                  {doc.title}
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                  {doc.desc}
                </p>
                <span style={{ 
                  fontSize: '0.75rem', 
                  background: 'var(--surface-alt)', 
                  padding: '2px 8px', 
                  borderRadius: 'var(--radius-sm)', 
                  color: 'var(--navy-600)', 
                  fontFamily: 'var(--font-mono)' 
                }}>
                  {doc.size}
                </span>
              </div>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={() => handleDownload(doc.title)} 
                title="ดาวน์โหลด"
              >
                📥
              </button>
            </div>
          ))}
        </div>

        {/* FAQ Accordion */}
        <div className="faq-accordion">
          {FAQ_LIST.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div key={index} className={`faq-item ${isOpen ? 'open' : ''}`}>
                <div 
                  className="faq-question" 
                  onClick={() => toggleFaq(index)}
                  role="button"
                  tabIndex={0}
                >
                  <span>{faq.question}</span>
                  <span className="faq-icon" style={{ 
                    transition: 'transform 0.2s ease',
                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    ▼
                  </span>
                </div>
                {isOpen && (
                  <div className="faq-answer">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
