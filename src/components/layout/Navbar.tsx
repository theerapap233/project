import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useScholarship } from '../../context/ScholarshipContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    scrollToSection,
    isAdminActive,
    isPreviewMode,
    setIsPreviewMode,
    openLogoutModal,
    updateCurrentUser,
    showToast
  } = useScholarship();
  
  const { theme, setTheme } = useTheme();

  const isStaffMode = Boolean(currentUser && isAdminActive);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    studentId: currentUser?.studentId || '',
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    faculty: currentUser?.faculty || 'คณะวิทยาศาสตร์ประยุกต์',
    major: currentUser?.major || 'ภาควิชาคณิตศาสตร์ (คณิตศาสตร์ประยุกต์)'
  });

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        studentId: currentUser.studentId,
        name: currentUser.name,
        email: currentUser.email,
        faculty: currentUser.faculty,
        major: currentUser.major
      });
    }
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-profile-menu-trigger]') && !target.closest('[data-profile-menu-root]')) {
        setIsProfileMenuOpen(false);
        setIsEditingProfile(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const trimmedName = profileForm.name.trim();
    const trimmedEmail = profileForm.email.trim();
    const trimmedStudentId = profileForm.studentId.trim();

    if (!trimmedName || !trimmedEmail || !trimmedStudentId) {
      showToast('กรุณากรอกชื่อ อีเมล และรหัสประจำตัวให้ครบถ้วน', 'warning');
      return;
    }

    updateCurrentUser({
      ...profileForm,
      name: trimmedName,
      email: trimmedEmail,
      studentId: trimmedStudentId,
      faculty: profileForm.faculty.trim() || currentUser.faculty,
      major: profileForm.major.trim() || currentUser.major
    });
    setIsProfileMenuOpen(false);
    setIsEditingProfile(false);
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <div
          className="brand-wrapper"
          onClick={() => (isStaffMode && !isPreviewMode) ? window.scrollTo({ top: 0, behavior: 'smooth' }) : scrollToSection('hero')}
          role="button"
          tabIndex={0}
        >
          <img
            src="/logo.png"
            alt="ภาควิชาคณิตศาสตร์ มจพ."
            className="brand-logo-img"
          />
          <div className="brand-text">
            <span className="brand-title">
              {(isStaffMode && !isPreviewMode) ? 'ระบบจัดการเว็บไซต์และทุนการศึกษา (Staff Portal)' : 'ระบบทุนการศึกษา ภาควิชาคณิตศาสตร์'}
            </span>
            <span className="brand-subtitle">
              {(isStaffMode && !isPreviewMode) ? 'ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มจพ.' : 'คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ'}
            </span>
          </div>
        </div>

        <nav>
          {isStaffMode && !isPreviewMode ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            </div>
          ) : (
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
          )}
        </nav>

        <div className="header-actions">
          {/* Theme Toggle Button */}
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            style={{
              background: 'transparent',
              border: '1px solid var(--border-light)',
              color: 'var(--text-main)',
              width: 36,
              height: 36,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginRight: 10
            }}
            title={`เปลี่ยนธีม (ปัจจุบัน: ${theme})`}
          >
            {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {currentUser ? (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
              {isStaffMode && isPreviewMode ? (
                <button
                  onClick={() => {
                    setIsPreviewMode(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="btn btn-sm"
                  style={{
                    background: 'var(--math-green, #077b38)',
                    color: 'white',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-full, 9999px)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer'
                  }}
                  title="กลับไปที่แดชบอร์ดจัดการเว็บไซต์"
                >
                  <span>↩</span> จัดการเว็บไซต์
                </button>
              ) : null}

              <button
                type="button"
                data-profile-menu-trigger="true"
                onClick={() => {
                  setIsProfileMenuOpen(prev => !prev);
                  setIsEditingProfile(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(6, 136, 68, 0.08)',
                  border: '2px solid rgba(6, 136, 68, 0.45)',
                  borderRadius: '50%',
                  padding: '4px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(7, 123, 56, 0.12)'
                }}
                title="ข้อมูลส่วนตัวและออกจากระบบ"
              >
                <span style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #1f7a4d, #0d5f37)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.18)'
                }}>
                  ⚙️
                </span>
              </button>

              {isProfileMenuOpen && (
                <div
                  data-profile-menu-root="true"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 10px)',
                    width: 220,
                    background: 'var(--surface-card)',
                    borderRadius: '12px',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    boxShadow: '0 10px 25px rgba(15, 23, 42, 0.1)',
                    padding: '8px',
                    zIndex: 1000
                  }}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-light)', marginBottom: 8 }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>ตั้งค่าข้อมูลส่วนตัว</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(true);
                        setIsProfileMenuOpen(false);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: '0.8rem',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 600
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>✏️</span> แก้ไขข้อมูลส่วนตัว
                    </button>

                    <button
                      type="button"
                      onClick={openLogoutModal}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: '0.8rem',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 600
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>🚪</span> ออกจากระบบ
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {isEditingProfile && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: 'var(--surface-card)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: 500,
            padding: 24,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>แก้ไขข้อมูลส่วนตัว</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>อัปเดตข้อมูลส่วนตัวของคุณในระบบ</p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                style={{
                  background: 'var(--surface-ground)',
                  border: 'none',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: '1rem'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>ชื่อ-นามสกุล</label>
                  <input
                    className="form-input-light"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="กรอกชื่อ-นามสกุล"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>รหัสประจำตัว</label>
                  <input
                    className="form-input-light"
                    value={profileForm.studentId}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, studentId: e.target.value }))}
                    placeholder="0000000000000"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>อีเมล</label>
                  <input
                    type="email"
                    className="form-input-light"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="name@kmutnb.ac.th"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>คณะ</label>
                  <input
                    className="form-input-light"
                    value={profileForm.faculty}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, faculty: e.target.value }))}
                    placeholder="คณะวิทยาศาสตร์ประยุกต์"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>สาขา / หน่วยงาน</label>
                  <input
                    className="form-input-light"
                    value={profileForm.major}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, major: e.target.value }))}
                    placeholder="ภาควิชาคณิตศาสตร์ / งานกิจการนักศึกษา"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditingProfile(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
