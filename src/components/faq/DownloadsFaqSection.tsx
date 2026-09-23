import React, { useState } from 'react';
import { useScholarship } from '../../context/ScholarshipContext';

export const DownloadsFaqSection: React.FC = () => {
  const { downloads, faqs, showToast } = useScholarship();
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
      <div className="container" style={{ maxWidth: '1024px' }}>
        <div className="section-header">
          <span className="section-tag">Downloads & Help</span>
          <h2 className="section-title">แบบฟอร์มเอกสารและคำถามที่พบบ่อย</h2>
          <p className="section-subtitle">ดาวน์โหลดแบบฟอร์มทางการ และค้นหาคำตอบสำหรับข้อสงสัยในการขอรับทุนการศึกษา</p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'start'
        }}>
          {/* Left Column: Downloads */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--navy-900)', marginBottom: 20 }}>
              เอกสารและแบบฟอร์ม
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {downloads.map(doc => (
                <div key={doc.id} className="download-card" style={{ margin: 0, padding: '16px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--navy-900)', marginBottom: 2 }}>
                      {doc.title}
                    </h4>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                      {doc.desc}
                    </p>
                  </div>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    onClick={() => handleDownload(doc.title)} 
                    title="ดาวน์โหลด"
                    style={{ padding: '6px 10px', fontSize: '1rem', background: 'transparent', border: '1px solid var(--border-light)' }}
                  >
                    📥
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: FAQ */}
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--navy-900)', marginBottom: 20 }}>
              คำถามที่พบบ่อย (FAQ)
            </h3>
            <div className="faq-accordion" style={{ margin: 0 }}>
              {faqs.map((faq, index) => {
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
        </div>
      </div>
    </section>
  );
};
