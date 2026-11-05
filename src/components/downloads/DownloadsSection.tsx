import React from 'react';
import { Download } from 'lucide-react';
import { useScholarship } from '../../context/ScholarshipContext';

export const DownloadsSection: React.FC = () => {
  const { downloads, showToast } = useScholarship();

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
          <span className="section-tag">Downloads</span>
          <h2 className="section-title">เอกสารและแบบฟอร์มการสมัคร</h2>
          <p className="section-subtitle">ดาวน์โหลดแบบฟอร์มทางการที่ใช้ประกอบการยื่นขอรับทุนการศึกษา</p>
        </div>

        <div className="download-grid">
          {downloads.map(doc => (
            <div key={doc.id} className="download-card" style={{ margin: 0, padding: '16px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--navy-900)', margin: 0 }}>
                    {doc.title}
                  </h4>
                  <span style={{
                    fontSize: '0.68rem',
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: '#f1f5f9',
                    color: '#64748b',
                    fontWeight: 600
                  }}>
                    {doc.type || 'PDF'} {doc.size ? `• ${doc.size}` : ''}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  {doc.desc}
                </p>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownload(doc.title)}
                title="ดาวน์โหลด"
                style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', background: '#f8fafc', border: '1px solid var(--border-light)' }}
              >
                <Download size={14} />
                <span>ดาวน์โหลด</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
