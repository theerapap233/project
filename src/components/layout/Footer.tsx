import React from 'react';
import { useScholarship } from '../../context/ScholarshipContext';

export const Footer: React.FC = () => {
  const { openLoginModal, currentUser } = useScholarship();
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <img
                src="/logo.png"
                alt="Mathematics KMUTNB"
                style={{ width: 52, height: 52, borderRadius: '50%', background: 'var(--surface-card)', padding: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
              />
              <div>
                <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'white' }}>ภาควิชาคณิตศาสตร์ มจพ.</h4>
                <span style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)' }}>Department of Mathematics, KMUTNB</span>
              </div>
            </div>
            <p style={{ marginBottom: 16, fontSize: '0.95rem', lineHeight: 1.7 }}>
              คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ<br />
              1518 ถนนประชาราษฎร์ 1 แขวงวงศ์สว่าง เขตบางซื่อ กรุงเทพฯ 10800
            </p>
            <div style={{ display: 'flex', gap: 14, fontSize: '0.9rem', flexWrap: 'wrap' }}>
              <span>📞 02-555-2000 ต่อ 4601-4602</span>
              <span>✉️ math@sci.kmutnb.ac.th</span>
            </div>
          </div>

          <div className="footer-links">
            <h5>ลิงก์ด่วน</h5>
            <ul>
              <li><a href="https://kmutnb.ac.th" target="_blank" rel="noopener noreferrer">เว็บไซต์ มหาวิทยาลัย มจพ.</a></li>
              <li><a href="https://reg.kmutnb.ac.th" target="_blank" rel="noopener noreferrer">เว็บไซต์ ทะเบียนนักศึกษา</a></li>
              {!currentUser && (
                <li>
                  <a
                    href="#"
                    onClick={(e) => { e.preventDefault(); openLoginModal(); }}
                    title="เข้าสู่ระบบสำหรับเจ้าหน้าที่ (Ctrl+Shift+A)"
                  >
                    เว็บไซต์ ระบบจัดการสำหรับเจ้าหน้าที่
                  </a>
                </li>
              )}
            </ul>
          </div>

          <div className="footer-links">
            <h5>หลักสูตรภาควิชา</h5>
            <ul>
              <li>หลักสูตร วท.บ. คณิตศาสตร์ประยุกต์</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ textAlign: 'center', width: '100%' }}>
            &copy; {new Date().getFullYear()} ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ. All Rights Reserved.
          </div>

        </div>
      </div>
    </footer>
  );
};
