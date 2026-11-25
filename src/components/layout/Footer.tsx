import React from 'react';
import { useScholarship } from '../../context/ScholarshipContext';

export const Footer: React.FC = () => {
  const { siteSettings } = useScholarship();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <img
                src="/logo.png"
                alt="Mathematics KMUTNB"
                style={{ 
                  width: 52, 
                  height: 52, 
                  borderRadius: '50%', 
                  background: '#ffffff', 
                  padding: 3, 
                  border: '1.5px solid #86efac',
                  boxShadow: '0 4px 12px rgba(22, 101, 52, 0.08)' 
                }}
              />
              <div>
                <h4 className="footer-brand-title">
                  ภาควิชาคณิตศาสตร์ มจพ.
                </h4>
                <span className="footer-subtitle">
                  Department of Mathematics, KMUTNB
                </span>
              </div>
            </div>
            <p className="footer-desc">
              คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ<br />
              1518 ถนนประชาราษฎร์ 1 แขวงวงศ์สว่าง เขตบางซื่อ กรุงเทพฯ 10800
            </p>
          </div>

          <div className="footer-links">
            <h5>
              ลิงก์ด่วน
            </h5>
            <ul>
              <li>
                <a href="https://kmutnb.ac.th" target="_blank" rel="noopener noreferrer">
                  มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
                </a>
              </li>
              <li>
                <a href="https://reg.kmutnb.ac.th" target="_blank" rel="noopener noreferrer">
                  ระบบสารสนเทศเพื่องานทะเบียนนักศึกษา
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-links">
            <h5>
              หลักสูตรภาควิชา
            </h5>
            <ul>
              <li>
                <a href="https://math.sci.kmutnb.ac.th" target="_blank" rel="noopener noreferrer">
                  หลักสูตร วท.บ. คณิตศาสตร์ประยุกต์
                </a>
              </li>
            </ul>
          </div>

          <div className="footer-links">
            <h5>
              ติดต่อ
            </h5>
            <ul>
              <li>
                <a href={`tel:${siteSettings.contactPhone.replace(/[^0-9+]/g, '')}`}>
                  โทร: {siteSettings.contactPhone}
                </a>
              </li>
              <li>
                <a href={`mailto:${siteSettings.contactEmail}`}>
                  อีเมล: {siteSettings.contactEmail}
                </a>
              </li>
              {siteSettings.facebookUrl && (
                <li>
                  <a href={siteSettings.facebookUrl} target="_blank" rel="noopener noreferrer">
                    Facebook ภาควิชาคณิตศาสตร์
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>
            &copy; {new Date().getFullYear()} ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ. All Rights Reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
