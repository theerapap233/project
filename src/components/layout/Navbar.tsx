import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useScholarship } from '../../context/ScholarshipContext';
import { StudentPersonalInfoForm } from '../profile/StudentPersonalInfoForm';
import {
  calculateStudentYear,
  createEmptyPersonalInfo,
  DEPARTMENT_MAJOR_OPTIONS,
  hasFilledPersonalInfo,
  normalizeMajorName,
  normalizePersonalInfo
} from '../../utils/studentProfile';
import {
  AtSign,
  BriefcaseBusiness,
  Camera,
  ClipboardList,
  GraduationCap,
  LogIn,
  Mail,
  Phone,
  ShieldCheck,
  Trash2,
  UserRound,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    hasStaffCredentials,
    scrollToSection,
    isAdminActive,
    isPreviewMode,
    openLoginModal,
    openLogoutModal,
    updateCurrentUser,
    changeStaffCredentials,
    changeStudentPassword,
    showToast,
    openMyApplications
  } = useScholarship();

  const isStaffMode = Boolean(currentUser && isAdminActive);
  const isStudent = Boolean(currentUser && currentUser.role === 'student');
  const staffNamePart = currentUser?.name.trim().split(/\s+/)[0] || (isStudent ? 'นักศึกษา' : 'Staff');
  const staffInitials = staffNamePart.replace(/^[เแโใไ]/, '').slice(0, 1) || (isStudent ? 'น' : 'S');

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isPersonalInfoModalOpen, setIsPersonalInfoModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [profileForm, setProfileForm] = useState({
    username: currentUser?.username || currentUser?.studentId || '',
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    major: isStudent ? normalizeMajorName(currentUser?.major) : (currentUser?.major || ''),
    year: calculateStudentYear(currentUser?.studentId, currentUser?.year),
    gpax: currentUser?.gpax !== undefined ? String(currentUser.gpax) : '3.00',
    position: currentUser?.position || (currentUser?.role === 'admin' ? 'เจ้าหน้าที่ธุรการ/กรรมการทุน' : currentUser?.major || ''),
    avatarUrl: currentUser?.avatarUrl || ''
  });

  const [personalForm, setPersonalForm] = useState(() =>
    currentUser?.personalInfo ? normalizePersonalInfo(currentUser.personalInfo) : createEmptyPersonalInfo()
  );

  useEffect(() => {
    if (currentUser) {
      setProfileForm({
        username: currentUser.username || currentUser.studentId,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || '',
        major: isStudent ? normalizeMajorName(currentUser.major) : (currentUser.major || ''),
        year: calculateStudentYear(currentUser.studentId, currentUser.year),
        gpax: currentUser.gpax !== undefined ? String(currentUser.gpax) : '3.00',
        position: currentUser.position || (currentUser.role === 'admin' ? 'เจ้าหน้าที่ธุรการ/กรรมการทุน' : currentUser.major || ''),
        avatarUrl: currentUser.avatarUrl || ''
      });
      setPersonalForm(
        currentUser.personalInfo ? normalizePersonalInfo(currentUser.personalInfo) : createEmptyPersonalInfo()
      );
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

    if (!trimmedName || !trimmedEmail) {
      showToast('กรุณากรอกชื่อและอีเมลให้ครบถ้วน', 'warning');
      return;
    }

    if (isStudent) {
      const gpaxNum = parseFloat(profileForm.gpax);
      if (isNaN(gpaxNum) || gpaxNum < 0 || gpaxNum > 4.0) {
        showToast('เกรดเฉลี่ยสะสม (GPAX) ต้องอยู่ระหว่าง 0.00 - 4.00', 'warning');
        return;
      }

      updateCurrentUser({
        name: trimmedName,
        email: trimmedEmail,
        phone: profileForm.phone.trim(),
        major: profileForm.major.trim(),
        year: profileForm.year,
        gpax: gpaxNum,
        avatarUrl: profileForm.avatarUrl || null
      });

      setIsProfileMenuOpen(false);
      setIsEditingProfile(false);
      return;
    }

    // Staff Profile Save
    const trimmedUsername = profileForm.username.trim();
    if (!trimmedUsername || !profileForm.position.trim()) {
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
      gpax: profileForm.gpax ? parseFloat(profileForm.gpax) : undefined,
      name: trimmedName,
      email: trimmedEmail,
      username: trimmedUsername,
      avatarUrl: profileForm.avatarUrl || null,
      position: profileForm.position.trim()
    });
    setIsProfileMenuOpen(false);
    setIsEditingProfile(false);
  };

  // บันทึกข้อมูลประกอบการพิจารณาทุนแยกจากข้อมูลส่วนตัว
  const handleSavePersonalInfo = (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) return;
    updateCurrentUser({ personalInfo: personalForm });
    setIsPersonalInfoModalOpen(false);
  };

  const openPersonalInfoModal = () => {
    setPersonalForm(
      currentUser?.personalInfo ? normalizePersonalInfo(currentUser.personalInfo) : createEmptyPersonalInfo()
    );
    setIsProfileMenuOpen(false);
    setIsPersonalInfoModalOpen(true);
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();

    if (newPassword.length < 6) {
      showToast('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร', 'warning');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน', 'warning');
      return;
    }

    if (isStudent) {
      const res = await changeStudentPassword(currentPassword, newPassword);
      if (res.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
        setIsChangingPassword(false);
      }
      return;
    }

    // Staff password change
    if (hasStaffCredentials && !currentPassword) {
      showToast('กรุณากรอกรหัสผ่านเดิมเพื่อยืนยัน', 'warning');
      return;
    }
    if (newPassword.length < 8) {
      showToast('รหัสผ่านเจ้าหน้าที่ใหม่ต้องมีอย่างน้อย 8 ตัวอักษร', 'warning');
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
            <>
              {/* Desktop Nav */}
              <ul className="nav-links">
                <li><button className="nav-item" onClick={() => { scrollToSection('hero'); document.querySelector('.nav-links')?.classList.remove('mobile-open'); }}>หน้าหลัก</button></li>
                <li><button className="nav-item" onClick={() => { scrollToSection('news'); document.querySelector('.nav-links')?.classList.remove('mobile-open'); }}>ข่าวสาร</button></li>
                <li><button className="nav-item" onClick={() => { scrollToSection('scholarships'); document.querySelector('.nav-links')?.classList.remove('mobile-open'); }}>ทุนการศึกษา</button></li>
                <li><button className="nav-item" onClick={() => { scrollToSection('downloads'); document.querySelector('.nav-links')?.classList.remove('mobile-open'); }}>เอกสารดาวน์โหลด</button></li>
                {isStudent && (
                  <li><button className="nav-item" onClick={() => { openMyApplications(); document.querySelector('.nav-links')?.classList.remove('mobile-open'); }}>สถานะใบสมัคร</button></li>
                )}
              </ul>
            </>
          )}
        </nav>

        <div className="header-actions">
          {/* Mobile Menu Toggle (Only visible on small screens) */}
          {!(isStaffMode && !isPreviewMode) && (
            <button 
              className="mobile-menu-toggle"
              onClick={() => {
                const nav = document.querySelector('.nav-links');
                nav?.classList.toggle('mobile-open');
              }}
              aria-label="Toggle mobile menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
          )}

          {/* Not logged in: Show Login button */}
          {!currentUser ? (
            <button
              type="button"
              className="btn btn-primary btn-sm btn-header-login"
              aria-label="เข้าสู่ระบบ"
              onClick={openLoginModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer'
              }}
            >
              <LogIn size={16} />
              <span>เข้าสู่ระบบ</span>
            </button>
          ) : (
            /* Logged in: Profile Pill & Dropdown */
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
                  gap: 8,
                  background: isStudent ? 'rgba(7, 123, 56, 0.08)' : 'rgba(100, 116, 139, 0.08)',
                  border: isStudent ? '1.5px solid rgba(7, 123, 56, 0.35)' : '2px solid rgba(100, 116, 139, 0.35)',
                  borderRadius: '24px',
                  padding: '3px 12px 3px 4px',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)'
                }}
                title={`โปรไฟล์ ${currentUser.name}`}
              >
                <span style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isStudent ? 'var(--math-green, #077b38)' : '#64748b',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.74rem',
                  letterSpacing: '0.02em',
                  fontWeight: 700,
                  overflow: 'hidden',
                  boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.2)'
                }}>
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="รูปโปรไฟล์" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : staffInitials}
                </span>

                <div style={{ textAlign: 'left', lineHeight: 1.25 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {staffNamePart}
                  </div>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    color: isStudent ? '#077b38' : '#475569',
                    background: isStudent ? '#ecfdf5' : '#f1f5f9',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    display: 'inline-block'
                  }}>
                    {isStudent ? '🎓 นักศึกษา' : '🛡️ เจ้าหน้าที่'}
                  </span>
                </div>
              </button>

              {isProfileMenuOpen && (
                <div
                  data-profile-menu-root="true"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 10px)',
                    width: 300,
                    background: 'var(--surface-card)',
                    borderRadius: '14px',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                    padding: '8px',
                    zIndex: 1000
                  }}
                >
                  {/* User Profile Header Card */}
                  <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-light)', marginBottom: 8 }}>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {currentUser.name}
                    </div>
                    {isStudent ? (
                      <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: '0.78rem', color: 'var(--math-green)', fontWeight: 600 }}>
                          รหัส: {currentUser.studentId}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {currentUser.major}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {currentUser.gpax !== undefined ? (
                            <>GPAX: <strong>{Number(currentUser.gpax).toFixed(2)}</strong> • </>
                          ) : null}
                          {calculateStudentYear(currentUser.studentId, currentUser.year)}
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {currentUser.position || 'เจ้าหน้าที่ธุรการ/กรรมการทุน'}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {isStudent && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          openMyApplications();
                        }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '8px 12px',
                          textAlign: 'left',
                          fontSize: '0.82rem',
                          color: 'var(--math-green, #077b38)',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontWeight: 700
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span>📨</span>
                        <span>ใบสมัครของฉัน / ติดตามสถานะ</span>
                      </button>
                    )}

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
                        fontSize: '0.82rem',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 600
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>{isStudent ? '🎓' : '✏️'}</span>
                      <span>{isStudent ? 'ข้อมูลส่วนตัวนักศึกษา' : 'แก้ไขข้อมูลส่วนตัว'}</span>
                    </button>

                    {isStudent && (
                      <button
                        type="button"
                        onClick={openPersonalInfoModal}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          padding: '8px 12px',
                          textAlign: 'left',
                           fontSize: '0.82rem',
                          color: 'var(--text-main)',
                          cursor: 'pointer',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontWeight: 600
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span>📋</span>
                        <span>ข้อมูลประกอบการพิจารณาทุน</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setCurrentPassword('');
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
                        fontSize: '0.82rem',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 600
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-alt)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>🔒</span>
                      <span>เปลี่ยนรหัสผ่าน</span>
                    </button>

                    <button
                      type="button"
                      onClick={openLogoutModal}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: '0.82rem',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontWeight: 600
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger-bg)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span>🚪</span>
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditingProfile && typeof document !== 'undefined' && createPortal(
        <div className="staff-profile-overlay" onClick={() => setIsEditingProfile(false)}>
          <div
            className="staff-profile-edit-dialog"
            data-profile-menu-root="true"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480, width: 'min(100%, 480px)' }}
          >
            <div className="staff-profile-edit-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isStudent ? <GraduationCap size={20} color="var(--math-green)" /> : <ShieldCheck size={20} color="var(--navy-800)" />}
                <h3 style={{ margin: 0 }}>
                  {isStudent ? 'ข้อมูลส่วนตัวนักศึกษา' : 'แก้ไขข้อมูลส่วนตัวเจ้าหน้าที่'}
                </h3>
              </div>
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
                    {profileForm.avatarUrl ? <img src={profileForm.avatarUrl} alt="รูปโปรไฟล์" /> : staffInitials}
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

              {isStudent ? (
                /* Student Profile Form Fields */
                <div className="staff-profile-edit-fields" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="staff-profile-edit-field">
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-800)', display: 'block', marginBottom: 4 }}>
                      ชื่อ-นามสกุล
                    </label>
                    <div className="staff-profile-input-wrap">
                      <UserRound size={17} aria-hidden="true" />
                      <input
                        className="form-input-light"
                        aria-label="ชื่อ-นามสกุล"
                        value={profileForm.name}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="ชื่อ-นามสกุล"
                        required
                      />
                    </div>
                  </div>

                  <div className="staff-profile-edit-field">
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-800)', display: 'block', marginBottom: 4 }}>
                      รหัสนักศึกษา (ไม่สามารถแก้ไขได้)
                    </label>
                    <div className="staff-profile-input-wrap" style={{ background: '#f1f5f9' }}>
                      <AtSign size={17} aria-hidden="true" />
                      <input
                        className="form-input-light"
                        aria-label="รหัสนักศึกษา"
                        value={currentUser?.studentId || ''}
                        disabled
                        style={{ cursor: 'not-allowed', color: '#64748b' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                    <div className="staff-profile-edit-field">
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-800)', display: 'block', marginBottom: 4 }}>
                        สาขาวิชา
                      </label>
                      <select
                        className="form-input-light"
                        value={profileForm.major}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, major: e.target.value }))}
                        required
                      >
                        {profileForm.major && !(DEPARTMENT_MAJOR_OPTIONS as readonly string[]).includes(profileForm.major) && (
                          <option value={profileForm.major}>{profileForm.major}</option>
                        )}
                        {DEPARTMENT_MAJOR_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>

                    <div className="staff-profile-edit-field">
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-800)', display: 'block', marginBottom: 4 }}>
                        ชั้นปี
                      </label>
                      <select
                        className="form-input-light"
                        value={profileForm.year}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, year: e.target.value }))}
                        required
                      >
                        <option value="ปี 1">ปี 1</option>
                        <option value="ปี 2">ปี 2</option>
                        <option value="ปี 3">ปี 3</option>
                        <option value="ปี 4">ปี 4</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div className="staff-profile-edit-field">
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-800)', display: 'block', marginBottom: 4 }}>
                        เบอร์โทรศัพท์
                      </label>
                      <div className="staff-profile-input-wrap">
                        <Phone size={17} aria-hidden="true" />
                        <input
                          type="tel"
                          className="form-input-light"
                          aria-label="เบอร์โทรศัพท์"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="เช่น 089-123-4567"
                        />
                      </div>
                    </div>

                    <div className="staff-profile-edit-field">
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-800)', display: 'block', marginBottom: 4 }}>
                        เกรดเฉลี่ยสะสม (GPAX)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="4.00"
                        className="form-input-light"
                        aria-label="GPAX"
                        value={profileForm.gpax}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, gpax: e.target.value }))}
                        placeholder="เช่น 3.45"
                        required
                      />
                    </div>
                  </div>

                  <div className="staff-profile-edit-field">
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--navy-800)', display: 'block', marginBottom: 4 }}>
                      อีเมลนักศึกษา มจพ.
                    </label>
                    <div className="staff-profile-input-wrap">
                      <Mail size={17} aria-hidden="true" />
                      <input
                        type="email"
                        className="form-input-light"
                        aria-label="อีเมล"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="อีเมล"
                        required
                      />
                    </div>
                  </div>

                  {/* ข้อมูลเชิงลึก (ที่อยู่ ครอบครัว เงินทุน กิจกรรม) แยกไปที่เมนู "ข้อมูลประกอบการพิจารณาทุน" */}
                  <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed var(--border-light)' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        openPersonalInfoModal();
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        color: 'var(--math-green)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 6
                      }}
                    >
                      <ClipboardList size={14} />
                      <span>ไปกรอกข้อมูลประกอบการพิจารณาทุน</span>
                      <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>
                        ({hasFilledPersonalInfo(personalForm) ? 'มีข้อมูลแล้ว' : 'ยังไม่ได้กรอก'})
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Staff Profile Form Fields */
                <div className="staff-profile-edit-fields">
                  <div className="staff-profile-edit-field">
                    <div className="staff-profile-input-wrap">
                      <UserRound size={17} aria-hidden="true" />
                      <input className="form-input-light" aria-label="ชื่อ-นามสกุล" value={profileForm.name} onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))} placeholder="ชื่อ-นามสกุล" required />
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
                      <input type="email" className="form-input-light" aria-label="อีเมล" value={profileForm.email} onChange={(e) => setProfileForm(prev => ({ ...prev, email: e.target.value }))} placeholder="อีเมล" required />
                    </div>
                  </div>

                  <div className="staff-profile-edit-field">
                    <div className="staff-profile-input-wrap">
                      <BriefcaseBusiness size={17} aria-hidden="true" />
                      <input className="form-input-light" aria-label="ตำแหน่ง" value={profileForm.position} onChange={(e) => setProfileForm(prev => ({ ...prev, position: e.target.value }))} placeholder="ตำแหน่ง" required />
                    </div>
                  </div>
                </div>
              )}

              <div className="staff-profile-dialog-actions" style={{ marginTop: 20 }}>
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

      {/* Personal Info Modal (ข้อมูลประกอบการพิจารณาทุน) */}
      {isPersonalInfoModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="staff-profile-overlay" onClick={() => setIsPersonalInfoModalOpen(false)}>
          <div
            className="staff-profile-edit-dialog"
            data-profile-menu-root="true"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 640, width: 'min(100%, 640px)' }}
          >
            <div className="staff-profile-edit-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClipboardList size={20} color="var(--math-green)" />
                <h3 style={{ margin: 0 }}>ข้อมูลประกอบการพิจารณาทุน</h3>
              </div>
              <button
                type="button"
                className="staff-profile-close"
                onClick={() => setIsPersonalInfoModalOpen(false)}
                aria-label="ปิดหน้าต่าง"
                title="ปิด"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePersonalInfo}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 9px',
                    borderRadius: 999,
                    whiteSpace: 'nowrap',
                    background: hasFilledPersonalInfo(personalForm) ? '#ecfdf5' : '#fef3c7',
                    color: hasFilledPersonalInfo(personalForm) ? '#047857' : '#92400e',
                    border: `1px solid ${hasFilledPersonalInfo(personalForm) ? '#a7f3d0' : '#fde68a'}`
                  }}
                >
                  {hasFilledPersonalInfo(personalForm) ? 'มีข้อมูลแล้ว' : 'ยังไม่ได้กรอก'}
                </span>
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  กรอกครั้งเดียว ระบบจะนำไปเติมในใบสมัครทุนให้อัตโนมัติ
                </span>
              </div>

              <StudentPersonalInfoForm value={personalForm} onChange={setPersonalForm} />

              <div className="staff-profile-dialog-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsPersonalInfoModalOpen(false)}
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

      {/* Change Password Modal */}
      {isChangingPassword && typeof document !== 'undefined' && createPortal(
        <div className="staff-profile-overlay" onClick={() => setIsChangingPassword(false)}>
          <div
            className="staff-profile-dialog staff-password-dialog"
            data-profile-menu-root="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="staff-profile-dialog-header">
              <div>
                <h3>เปลี่ยนรหัสผ่าน</h3>
                <p>กรอกรหัสผ่านเดิมและรหัสผ่านใหม่เพื่อยืนยัน</p>
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
                    placeholder="กรอกรหัสผ่านปัจจุบัน"
                    required
                  />
                </label>
                <label>รหัสผ่านใหม่
                  <input
                    className="form-input-light"
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={event => setNewPassword(event.target.value)}
                    minLength={6}
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
                    minLength={6}
                    required
                  />
                </label>
              </div>
              <p className="staff-credentials-note">รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร</p>
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
