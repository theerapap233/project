import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useScholarship } from '../../context/ScholarshipContext';
import { useTheme } from '../../context/ThemeContext';
import { AtSign, BriefcaseBusiness, Camera, Mail, Moon, Sun, Trash2, UserRound, X } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    hasStaffCredentials,
    scrollToSection,
    isAdminActive,
    isPreviewMode,
    openLogoutModal,
    updateCurrentUser,
    changeStaffCredentials,
    showToast
  } = useScholarship();
  
  const { theme, setTheme } = useTheme();

  const isStaffMode = Boolean(currentUser && isAdminActive);
  const staffNamePart = currentUser?.name.trim().split(/\s+/)[0] || 'Staff';
  const staffInitials = staffNamePart.replace(/^[เแโใไ]/, '').slice(0, 1) || 'S';
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [profileForm, setProfileForm] = useState({
    username: currentUser?.username || currentUser?.studentId || '',
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    position: currentUser?.position || (currentUser?.role === 'admin' ? 'เจ้าหน้าที่ธุรการ/กรรมการทุน' : currentUser?.major || ''),
    avatarUrl: currentUser?.avatarUrl || ''
  });

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        username: currentUser.username || currentUser.studentId,
        name: currentUser.name,
        email: currentUser.email,
        position: currentUser.position || (currentUser.role === 'admin' ? 'เจ้าหน้าที่ธุรการ/กรรมการทุน' : currentUser.major || ''),
        avatarUrl: currentUser.avatarUrl || ''
      });
    }
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest('[data-profile-menu-trigger]') &&
        !target.closest('[data-profile-menu-root]') &&
        !target.closest('.staff-profile-overlay')
      ) {
        setIsProfileMenuOpen(false);
        setIsEditingProfile(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('กรุณาเลือกไฟล์รูปภาพ', 'warning');
      return;
    }
    if (file.size > 1024 * 1024) {
      showToast('รูปโปรไฟล์ต้องมีขนาดไม่เกิน 1 MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileForm(prev => ({ ...prev, avatarUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const trimmedName = profileForm.name.trim();
    const trimmedEmail = profileForm.email.trim();
    const trimmedUsername = profileForm.username.trim();
    if (!trimmedName || !trimmedEmail || !trimmedUsername || !profileForm.position.trim()) {
      showToast('กรุณากรอกชื่อ อีเมล ตำแหน่ง และ username ให้ครบถ้วน', 'warning');
      return;
    }

    const credentialsChanged = trimmedUsername !== (currentUser.username || currentUser.studentId);
    if (credentialsChanged) {
      if (!hasStaffCredentials) {
        showToast('กรุณาตั้งรหัสผ่านก่อนเปลี่ยน username', 'warning');
        return;
      }
      const changed = await changeStaffCredentials(trimmedUsername, '');
      if (!changed) return;
    }

    updateCurrentUser({
      ...profileForm,
      name: trimmedName,
      email: trimmedEmail,
      username: trimmedUsername,
      avatarUrl: profileForm.avatarUrl || null,
      position: profileForm.position.trim()
    });
    setIsProfileMenuOpen(false);
    setIsEditingProfile(false);
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (hasStaffCredentials && !currentPassword) {
      showToast('กรุณากรอกรหัสผ่านเดิมเพื่อยืนยัน', 'warning');
      return;
    }
    if (newPassword.length < 8) {
      showToast('รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร', 'warning');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน', 'warning');
      return;
    }

    const username = currentUser?.username || currentUser?.studentId || '';
    const changed = await changeStaffCredentials(username, newPassword, currentPassword);
    if (!changed) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setIsChangingPassword(false);
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

          {currentUser ? (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                data-profile-menu-trigger="true"
                onClick={() => {
                  setIsProfileMenuOpen(prev => !prev);
                  setIsEditingProfile(false);
                }}
                aria-label={`เปิดโปรไฟล์ ${currentUser.name}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(100, 116, 139, 0.08)',
                  border: '2px solid rgba(100, 116, 139, 0.35)',
                  borderRadius: '50%',
                  padding: '4px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)'
                }}
                title={`โปรไฟล์ ${currentUser.name}`}
              >
                <span style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#64748b',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  letterSpacing: '0.02em',
                  fontWeight: 700,
                  overflow: 'hidden',
                  boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.18)'
                }}>
                    {currentUser.avatarUrl ? (
                      <img src={currentUser.avatarUrl} alt="รูปโปรไฟล์เจ้าหน้าที่" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : staffInitials}
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
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmNewPassword('');
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
                      onClick={() => {
                        setNewPassword('');
                        setConfirmNewPassword('');
                        setIsChangingPassword(true);
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
                      <span>🔒</span> {hasStaffCredentials ? 'เปลี่ยนรหัสผ่าน' : 'ตั้งรหัสผ่าน'}
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
        <div className="staff-profile-overlay">
          <div className="staff-profile-edit-dialog" data-profile-menu-root="true">
            <div className="staff-profile-edit-header">
              <h3>โปรไฟล์</h3>
              <button
                type="button"
                className="staff-profile-close"
                onClick={() => setIsEditingProfile(false)}
                aria-label="ปิดหน้าต่าง"
                title="ปิด"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="staff-profile-photo-editor staff-profile-photo-centered">
                <div className="staff-profile-avatar-wrap">
                <div className="staff-profile-photo-preview">
                  {profileForm.avatarUrl ? <img src={profileForm.avatarUrl} alt="ตัวอย่างรูปโปรไฟล์เจ้าหน้าที่" /> : staffInitials}
                </div>
                  <label className="staff-profile-photo-upload" htmlFor="staff-profile-photo" title="เปลี่ยนรูปโปรไฟล์" aria-label="เปลี่ยนรูปโปรไฟล์">
                    <Camera size={16} />
                  </label>
                  {profileForm.avatarUrl && (
                    <button type="button" className="staff-profile-photo-remove-icon" onClick={() => setProfileForm(prev => ({ ...prev, avatarUrl: '' }))} aria-label="ลบรูปโปรไฟล์" title="ลบรูปโปรไฟล์">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <input id="staff-profile-photo" className="staff-profile-file-input" type="file" accept="image/*" onChange={handleProfileImageChange} aria-label="เลือกรูปโปรไฟล์" />
              </div>

              <div className="staff-profile-edit-fields">
                <div className="staff-profile-edit-field">
                  <div className="staff-profile-input-wrap">
                    <UserRound size={17} aria-hidden="true" />
                    <input className="form-input-light" aria-label="ชื่อ-นามสกุล" value={profileForm.name} onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))} placeholder="ชื่อ-นามสกุล" />
                  </div>
                </div>

                <div className="staff-profile-edit-field">
                  <div className="staff-profile-input-wrap">
                    <AtSign size={17} aria-hidden="true" />
                    <input className="form-input-light" aria-label="ชื่อผู้ใช้" autoComplete="username" value={profileForm.username} onChange={event => setProfileForm(prev => ({ ...prev, username: event.target.value }))} placeholder="ชื่อผู้ใช้" required />
                  </div>
                </div>

                <div className="staff-profile-edit-field">
                  <div className="staff-profile-input-wrap">
                    <Mail size={17} aria-hidden="true" />
                    <input type="email" className="form-input-light" aria-label="อีเมล" value={profileForm.email} onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))} placeholder="อีเมล" />
                  </div>
                </div>

                <div className="staff-profile-edit-field">
                  <div className="staff-profile-input-wrap">
                    <BriefcaseBusiness size={17} aria-hidden="true" />
                    <input className="form-input-light" aria-label="ตำแหน่ง" value={profileForm.position} onChange={(e) => setProfileForm(prev => ({ ...prev, position: e.target.value }))} placeholder="ตำแหน่ง" />
                  </div>
                </div>
              </div>

              <div className="staff-profile-dialog-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditingProfile(false)}
                >
                  ยกเลิก
                </button>
                <button type="submit" className="btn btn-primary">
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {isChangingPassword && typeof document !== 'undefined' && createPortal(
        <div className="staff-profile-overlay">
          <div className="staff-profile-dialog staff-password-dialog" data-profile-menu-root="true">
            <div className="staff-profile-dialog-header">
              <div>
                <h3>{hasStaffCredentials ? 'เปลี่ยนรหัสผ่าน' : 'ตั้งรหัสผ่าน'}</h3>
                <p>กรอกรหัสผ่านใหม่และยืนยันอีกครั้ง</p>
              </div>
              <button type="button" className="staff-profile-close" onClick={() => setIsChangingPassword(false)} aria-label="ปิดหน้าต่าง">✕</button>
            </div>
            <form onSubmit={handleChangePassword}>
              <div className="staff-password-fields">
                <label className="staff-password-field-full">รหัสผ่านเดิม
                  <input
                    className="form-input-light"
                    type="password"
                    autoComplete="current-password"
                    value={currentPassword}
                    onChange={event => setCurrentPassword(event.target.value)}
                    placeholder={hasStaffCredentials ? 'กรอกรหัสผ่านปัจจุบัน' : 'ยังไม่มีรหัสผ่านเดิมในระบบ'}
                    required={hasStaffCredentials}
                  />
                  {!hasStaffCredentials && <small className="staff-password-first-setup">บัญชีนี้ยังไม่เคยตั้งรหัสผ่านในระบบ จึงไม่มีรหัสเดิมให้ตรวจ</small>}
                </label>
                <label>รหัสผ่านใหม่
                  <input
                    className="form-input-light"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={event => setNewPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                </label>
                <label>ยืนยันรหัสผ่านใหม่
                  <input
                    className="form-input-light"
                    type="password"
                    autoComplete="new-password"
                    value={confirmNewPassword}
                    onChange={event => setConfirmNewPassword(event.target.value)}
                    minLength={8}
                    required
                  />
                </label>
              </div>
              <p className="staff-credentials-note">รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร</p>
              <div className="staff-profile-dialog-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsChangingPassword(false)}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary">บันทึกรหัสผ่าน</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
