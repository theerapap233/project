import React from 'react';
import { useScholarship } from '../../context/ScholarshipContext';

export const Navbar: React.FC = () => {
  const { 
    currentUser,
    openLoginModal,
    logout,
    scrollToSection 
  } = useScholarship();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div 
          className="brand-wrapper" 
          onClick={() => scrollToSection('hero')} 
          role="button" 
          tabIndex={0}
        >
          <img 
            src="/logo.png" 
            alt="ภาควิชาคณิตศาสตร์ มจพ." 
            className="brand-logo-img" 
          />
          <div className="brand-text">
            <span className="brand-title">ระบบทุนการศึกษา ภาควิชาคณิตศาสตร์</span>
            <span className="brand-subtitle">คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</span>
          </div>
        </div>

        <nav>
          <ul className="nav-links">
            <li>
              <button className="nav-item" onClick={() => scrollToSection('hero')}>
                หน้าหลัก
              </button>
            </li>
            <li>
              <button className="nav-item" onClick={() => scrollToSection('news')}>
                ข่าวสาร
              </button>
            </li>
            <li>
              <button className="nav-item" onClick={() => scrollToSection('scholarships')}>
                ทุนการศึกษา
              </button>
            </li>
            <li>
              <button className="nav-item" onClick={() => scrollToSection('tracking')}>
                ตรวจสอบสถานะ
              </button>
            </li>
            <li>
              <button className="nav-item" onClick={() => scrollToSection('downloads')}>
                เอกสาร & FAQ
              </button>
            </li>
          </ul>
        </nav>

        <div className="header-actions">
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--math-green-soft)',
                padding: '5px 12px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--math-green-border)'
              }}>
                <span style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--math-green)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700
                }}>
                  {currentUser.name.charAt(0)}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--math-green-dark)', lineHeight: 1.1 }}>
                    {currentUser.name}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {currentUser.studentId}
                  </span>
                </div>
              </div>
              <button 
                className="btn btn-secondary btn-sm" 
                onClick={logout}
                title="ออกจากระบบ"
                style={{ padding: '6px 10px', fontSize: '0.8rem' }}
              >
                ออกจากระบบ
              </button>
            </div>
          ) : (
            <button 
              className="btn btn-primary btn-sm" 
              onClick={openLoginModal}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              เข้าสู่ระบบ
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
