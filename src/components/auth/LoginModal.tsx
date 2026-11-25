import React, { useState, useEffect } from 'react';
import { useScholarship } from '../../context/ScholarshipContext';
import {
  GraduationCap,
  ShieldCheck,
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus
} from 'lucide-react';
import { passwordResetService, type PasswordResetScope } from '../../services/passwordResetService';
import { getStudentRegistrationError } from '../../utils/studentRegistrationValidation';

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
    currentUser,
    openLoginModal,
    closeLoginModal,
    login,
    loginStudent,
    registerStudent,
    showToast
  } = useScholarship();

  // Active role tab: 'student' | 'staff'
  const [activeTab, setActiveTab] = useState<'student' | 'staff'>('student');

  // Student sub-mode: 'login' | 'register'
  const [studentMode, setStudentMode] = useState<'login' | 'register'>('login');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Staff login state
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');

  // Student login state
  const [studentIdentifier, setStudentIdentifier] = useState('');
  const [studentPassword, setStudentPassword] = useState('');

  // Student register state (เก็บเฉพาะข้อมูลเบื้องต้นที่จำเป็นต่อการสมัคร)
  const [registerForm, setRegisterForm] = useState({
    studentId: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [resetScope, setResetScope] = useState<PasswordResetScope>('student');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [resetOtpSent, setResetOtpSent] = useState(false);

  // Handle Ctrl+Shift+A or Alt+A and URL hash #admin or #login
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) ||
        (e.altKey && (e.key === 'A' || e.key === 'a'))
      ) {
        e.preventDefault();
        setActiveTab('staff');
        openLoginModal();
      }
    };

    const handleHashCheck = () => {
      if (currentUser) return;

      if (window.location.hash === '#admin') {
        setActiveTab('staff');
        openLoginModal();
      } else if (window.location.hash === '#login') {
        setActiveTab('student');
        openLoginModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('hashchange', handleHashCheck);
    handleHashCheck();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('hashchange', handleHashCheck);
    };
  }, [currentUser, openLoginModal]);

  if (!isLoginModalOpen) return null;

  // Handle Student Login Submit
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarningMsg(null);
    setIsSubmitting(true);

    try {
      const res = await loginStudent(studentIdentifier, studentPassword);
      if (!res.success) {
        setWarningMsg(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Student Register Submit
  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarningMsg(null);

    const registrationError = getStudentRegistrationError(registerForm);
    if (registrationError) {
      setWarningMsg(registrationError);
      return;
    }
    const cleanId = registerForm.studentId.trim();
    if (!registerForm.password || registerForm.password.length < 6) {
      setWarningMsg('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setWarningMsg('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerStudent({
        studentId: cleanId,
        name: registerForm.name.trim(),
        email: registerForm.email.trim(),
        phone: registerForm.phone.trim(),
        password: registerForm.password
      });

      if (!res.success) {
        setWarningMsg(res.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Staff Login Submit
  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarningMsg(null);
    const cleanEmail = staffEmail.trim();

    if (!cleanEmail) {
      showToast('กรุณากรอกอีเมลเจ้าหน้าที่', 'warning');
      return;
    }

    if (!staffPassword) {
      showToast('กรุณากรอกรหัสผ่าน', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(cleanEmail, staffPassword, 'เจ้าหน้าที่ธุรการ/กรรมการทุน ภาควิชาคณิตศาสตร์');
      if (!result.success) {
        const msg = result.message || 'อีเมลหรือรหัสผ่านเจ้าหน้าที่ไม่ถูกต้อง';
        setWarningMsg(msg);
        showToast(msg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    if (activeTab === 'staff') {
      showToast('กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่านเจ้าหน้าที่', 'info');
      return;
    }

    const loginIdentifier = studentIdentifier;
    setResetScope('student');
    setResetEmail(loginIdentifier.includes('@') ? loginIdentifier.trim() : '');
    setResetOtp('');
    setResetPassword('');
    setConfirmResetPassword('');
    setResetOtpSent(false);
    setWarningMsg(null);
    setIsPasswordResetOpen(true);
  };

  const closePasswordReset = () => {
    setIsPasswordResetOpen(false);
    setWarningMsg(null);
  };

  const requestPasswordResetOtp = async () => {
    setWarningMsg(null);
    setIsSubmitting(true);
    try {
      const result = await passwordResetService.requestOtp(resetScope, resetEmail);
      if (result.success) {
        setResetOtpSent(true);
      } else {
        setWarningMsg(result.message || 'ไม่สามารถส่งรหัส OTP ได้ กรุณาลองใหม่ภายหลัง');
      }
    } catch (error) {
      console.error('Password reset OTP request failed:', error);
      setWarningMsg('ไม่สามารถเชื่อมต่อระบบรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่ภายหลัง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestPasswordResetOtp = (e: React.FormEvent) => {
    e.preventDefault();
    void requestPasswordResetOtp();
  };

  const handleCompletePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setWarningMsg(null);
    if (resetPassword.length < 8 || resetPassword.length > 128) {
      setWarningMsg('รหัสผ่านใหม่ต้องมีความยาว 8-128 ตัวอักษร');
      return;
    }
    if (resetPassword !== confirmResetPassword) {
      setWarningMsg('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await passwordResetService.resetPassword(
        resetScope,
        resetEmail,
        resetOtp,
        resetPassword
      );
      if (!result.success) {
        setWarningMsg(result.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่');
        return;
      }

      if (resetScope === 'student') {
        setStudentIdentifier(resetEmail);
        setStudentPassword('');
      } else {
        setStaffEmail(resetEmail);
        setStaffPassword('');
      }
      showToast('เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่', 'success');
      closePasswordReset();
    } catch (error) {
      console.error('Password reset completion failed:', error);
      setWarningMsg('ไม่สามารถเชื่อมต่อระบบรีเซ็ตรหัสผ่านได้ กรุณาลองใหม่ภายหลัง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop open" onClick={closeLoginModal}>
        <div
          className="modal-card login-modal-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: studentMode === 'register' && activeTab === 'student' ? 540 : 460,
            padding: 0
          }}
        >
        <div className="login-modal-header">
          <button
            type="button"
            className="modal-close-btn"
            onClick={closeLoginModal}
            aria-label="ปิดหน้าต่างเข้าสู่ระบบ"
          >
            <span aria-hidden="true">&times;</span>
          </button>

          <div className="login-modal-brand">
            <div className="login-modal-icon" aria-hidden="true">
              {activeTab === 'student' ? (
                <GraduationCap size={24} strokeWidth={2} />
              ) : (
                <ShieldCheck size={24} strokeWidth={2} />
              )}
            </div>

            <div className="login-modal-brand-copy">
              <h3>
                {activeTab === 'student'
                  ? (studentMode === 'register' ? 'ลงทะเบียนนักศึกษาใหม่' : 'เข้าสู่ระบบนักศึกษา')
                  : 'เข้าสู่ระบบสำหรับเจ้าหน้าที่'}
              </h3>
              <p>
                {activeTab === 'student'
                  ? 'ระบบทุนการศึกษา ภาควิชาคณิตศาสตร์ มจพ.'
                  : 'สำหรับเจ้าหน้าที่และคณะกรรมการพิจารณาทุน'}
              </p>
            </div>
          </div>

          <div className="login-role-tabs" role="tablist" aria-label="เลือกระบบเข้าสู่ระบบ">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'student'}
              onClick={() => {
                setActiveTab('student');
                setWarningMsg(null);
              }}
              className={`login-role-tab${activeTab === 'student' ? ' active' : ''}`}
            >
              <GraduationCap size={16} />
              <span>นักศึกษา (Student)</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'staff'}
              onClick={() => {
                setActiveTab('staff');
                setWarningMsg(null);
              }}
              className={`login-role-tab${activeTab === 'staff' ? ' active' : ''}`}
            >
              <ShieldCheck size={16} />
              <span>เจ้าหน้าที่ (Staff)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="login-modal-body">
          {warningMsg && (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.84rem',
                color: '#991B1B',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 8,
                lineHeight: 1.45
              }}
            >
              <span style={{ fontSize: '1rem' }}>⚠️</span>
              <div style={{ flex: 1 }}>{warningMsg}</div>
            </div>
          )}

          {/* TAB 1: STUDENT */}
          {activeTab === 'student' && (
            <div>
              {/* Student Mode Switcher: Sign in / Register */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 16,
                  paddingBottom: 16,
                  borderBottom: '1px solid var(--border-light)',
                  marginBottom: 18
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setStudentMode('login');
                    setWarningMsg(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: studentMode === 'login' ? 700 : 500,
                    color: studentMode === 'login' ? 'var(--math-green)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderBottom: studentMode === 'login' ? '2px solid var(--math-green)' : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <LogIn size={15} />
                  <span>เข้าสู่ระบบ</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudentMode('register');
                    setWarningMsg(null);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '0.9rem',
                    fontWeight: studentMode === 'register' ? 700 : 500,
                    color: studentMode === 'register' ? 'var(--math-green)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderBottom: studentMode === 'register' ? '2px solid var(--math-green)' : '2px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <UserPlus size={15} />
                  <span>ลงทะเบียนนักศึกษาใหม่</span>
                </button>
              </div>

              {/* 1.1 STUDENT LOGIN FORM */}
              {studentMode === 'login' && (
                <form onSubmit={handleStudentLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 6, display: 'block' }}>
                      รหัสนักศึกษา หรือ อีเมล มจพ.
                    </label>
                    <div style={{ position: 'relative' }}>
                      <User
                        size={17}
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#94a3b8'
                        }}
                      />
                      <input
                        type="text"
                        className="form-input-light"
                        style={{ paddingLeft: 38 }}
                        placeholder="กรอกรหัสนักศึกษาหรืออีเมล"
                        value={studentIdentifier}
                        onChange={(e) => {
                          setStudentIdentifier(e.target.value);
                          if (warningMsg) setWarningMsg(null);
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <label style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--navy-800)', margin: 0 }}>
                        รหัสผ่าน
                      </label>
                      <a
                        href="#forgot-password"
                        onClick={handleForgotPassword}
                        style={{ fontSize: '0.8rem', color: 'var(--math-green)', textDecoration: 'none', cursor: 'pointer' }}
                      >
                        ลืมรหัสผ่าน?
                      </a>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock
                        size={17}
                        style={{
                          position: 'absolute',
                          left: 12,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#94a3b8'
                        }}
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-input-light"
                        style={{ paddingLeft: 38, paddingRight: 38 }}
                        placeholder="กรอกรหัสผ่านของคุณ"
                        value={studentPassword}
                        onChange={(e) => {
                          setStudentPassword(e.target.value);
                          if (warningMsg) setWarningMsg(null);
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: 10,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#94a3b8',
                          cursor: 'pointer',
                          padding: 4
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '11px 16px',
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: '0.92rem'
                    }}
                  >
                    <LogIn size={18} />
                    <span>{isSubmitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบนักศึกษา'}</span>
                  </button>
                </form>
              )}

              {/* 1.2 STUDENT REGISTRATION FORM */}
              {studentMode === 'register' && (
                <form onSubmit={handleStudentRegister} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div className="login-register-grid">
                    <div className="form-group">
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                        รหัสนักศึกษา 13 หลัก <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input-light"
                        placeholder="13 หลัก"
                        inputMode="numeric"
                        pattern="[0-9]{13}"
                        value={registerForm.studentId}
                        onChange={(e) => setRegisterForm({ ...registerForm, studentId: e.target.value.replace(/\D/g, '').slice(0, 13) })}
                        maxLength={13}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                        ชื่อ-นามสกุล <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input-light"
                        placeholder="มีคำนำหน้า"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="login-register-grid">
                    <div className="form-group">
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                        เบอร์โทรศัพท์ <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        className="form-input-light"
                        placeholder="10 หลัก เริ่มด้วย 0"
                        inputMode="numeric"
                        pattern="0[0-9]{9}"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                        อีเมลนักศึกษา มจพ. <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="email"
                        className="form-input-light"
                        placeholder="อีเมล มจพ."
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value.trim() })}
                        required
                      />
                    </div>
                  </div>

                  <div className="login-register-grid">
                    <div className="form-group">
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                        ตั้งรหัสผ่าน (อย่างน้อย 6 ตัว) <span style={{ color: 'red' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          className="form-input-light"
                          style={{ paddingRight: 34 }}
                          placeholder="อย่างน้อย 6 ตัว"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          minLength={6}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: 2
                          }}
                        >
                          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                        ยืนยันรหัสผ่าน <span style={{ color: 'red' }}>*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          className="form-input-light"
                          style={{ paddingRight: 34 }}
                          placeholder="ยืนยันรหัสผ่าน"
                          value={registerForm.confirmPassword}
                          onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                          minLength={6}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          style={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: 2
                          }}
                        >
                          {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                    style={{
                      width: '100%',
                      marginTop: 6,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '11px 16px',
                      borderRadius: 10,
                      fontWeight: 600,
                      fontSize: '0.92rem'
                    }}
                  >
                    <UserPlus size={18} />
                    <span>{isSubmitting ? 'กำลังบันทึกข้อมูล...' : 'ลงทะเบียนและเข้าสู่ระบบทันที'}</span>
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: STAFF / ADMIN */}
          {activeTab === 'staff' && (
            <form onSubmit={handleStaffSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="login-staff-note">
                สำหรับเจ้าหน้าที่และคณะกรรมการพิจารณาทุนการศึกษา ภาควิชาคณิตศาสตร์
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 6, display: 'block' }}>
                  อีเมลเจ้าหน้าที่
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={17}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8'
                    }}
                  />
                  <input
                    type="email"
                    className="form-input-light"
                    style={{ paddingLeft: 38 }}
                    placeholder="กรอกอีเมลเจ้าหน้าที่"
                    value={staffEmail}
                    autoCapitalize="none"
                    autoComplete="email"
                    onChange={(e) => {
                      setStaffEmail(e.target.value);
                      if (warningMsg) setWarningMsg(null);
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)', margin: 0 }}>
                    รหัสผ่านเจ้าหน้าที่
                  </label>
                  <a
                    href="#forgot-password"
                    onClick={handleForgotPassword}
                    style={{ fontSize: '0.8rem', color: 'var(--math-green)', textDecoration: 'none', cursor: 'pointer' }}
                  >
                    ลืมรหัสผ่าน?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock
                    size={17}
                    style={{
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8'
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-input-light"
                    style={{ paddingLeft: 38, paddingRight: 38 }}
                    placeholder="กรอกรหัสผ่านของคุณ"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 4
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  marginTop: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'var(--math-green)',
                  borderColor: 'var(--math-green)'
                }}
              >
                <ShieldCheck size={18} />
                <span>{isSubmitting ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบเจ้าหน้าที่'}</span>
              </button>
            </form>
          )}
        </div>
        </div>
      </div>
      {isPasswordResetOpen && (
        <div
          className="modal-backdrop open"
          style={{ zIndex: 2000 }}
          onClick={closePasswordReset}
        >
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-reset-title"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 460 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 id="password-reset-title" style={{ margin: 0, color: 'var(--navy-800)' }}>
                รีเซ็ตรหัสผ่าน{resetScope === 'student' ? 'นักศึกษา' : 'เจ้าหน้าที่'}
              </h3>
              <button
                type="button"
                onClick={closePasswordReset}
                className="modal-close-btn"
                aria-label="กลับเข้าสู่ระบบ"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <p style={{ margin: '0 0 18px', color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5 }}>
              กรอกอีเมลที่ผูกกับบัญชี ระบบจะส่งรหัส OTP ซึ่งมีอายุ 10 นาที
            </p>

            {warningMsg && (
              <div
                role="alert"
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FCA5A5',
                  borderRadius: 10,
                  padding: '10px 14px',
                  fontSize: '0.84rem',
                  color: '#991B1B',
                  marginBottom: 16
                }}
              >
                {warningMsg}
              </div>
            )}

            {!resetOtpSent ? (
              <form onSubmit={handleRequestPasswordResetOtp}>
                <div className="form-group">
                  <label
                    htmlFor="password-reset-email"
                    style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 6, display: 'block' }}
                  >
                    อีเมล
                  </label>
                  <input
                    id="password-reset-email"
                    type="email"
                    className="form-input-light"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%' }}>
                  {isSubmitting ? 'กำลังส่ง...' : 'ส่งรหัส OTP'}
                </button>
              </form>
            ) : (
              <>
                <div
                  style={{
                    background: '#F0FDF4',
                    border: '1px solid #86EFAC',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontSize: '0.84rem',
                    color: '#166534',
                    marginBottom: 16,
                    lineHeight: 1.5
                  }}
                >
                  หากอีเมลนี้ผูกกับบัญชีที่ใช้งานได้ ระบบจะส่งรหัส OTP ไปให้ภายในไม่กี่นาที
                </div>
                <form onSubmit={handleCompletePasswordReset}>
                  <div className="form-group">
                    <label
                      htmlFor="password-reset-email-sent"
                      style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 6, display: 'block' }}
                    >
                      อีเมล
                    </label>
                    <input
                      id="password-reset-email-sent"
                      type="email"
                      className="form-input-light"
                      value={resetEmail}
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label
                      htmlFor="password-reset-otp"
                      style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 6, display: 'block' }}
                    >
                      รหัส OTP 6 หลัก
                    </label>
                    <input
                      id="password-reset-otp"
                      type="text"
                      className="form-input-light"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label
                      htmlFor="password-reset-new-password"
                      style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 6, display: 'block' }}
                    >
                      รหัสผ่านใหม่ (8-128 ตัวอักษร)
                    </label>
                    <input
                      id="password-reset-new-password"
                      type="password"
                      className="form-input-light"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      value={resetPassword}
                      onChange={(e) => setResetPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label
                      htmlFor="password-reset-confirm-password"
                      style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 6, display: 'block' }}
                    >
                      ยืนยันรหัสผ่านใหม่
                    </label>
                    <input
                      id="password-reset-confirm-password"
                      type="password"
                      className="form-input-light"
                      autoComplete="new-password"
                      minLength={8}
                      maxLength={128}
                      value={confirmResetPassword}
                      onChange={(e) => setConfirmResetPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%' }}>
                    {isSubmitting ? 'กำลังเปลี่ยนรหัสผ่าน...' : 'ยืนยันและเปลี่ยนรหัสผ่าน'}
                  </button>
                </form>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setResetOtpSent(false);
                      setResetOtp('');
                      setWarningMsg(null);
                    }}
                    style={{ background: 'none', border: 'none', color: 'var(--math-green)', cursor: 'pointer' }}
                  >
                    เปลี่ยนอีเมล
                  </button>
                  <button
                    type="button"
                    onClick={() => void requestPasswordResetOtp()}
                    disabled={isSubmitting}
                    style={{ background: 'none', border: 'none', color: 'var(--math-green)', cursor: 'pointer' }}
                  >
                    ส่ง OTP อีกครั้ง
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
