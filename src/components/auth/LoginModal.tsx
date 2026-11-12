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

export const LoginModal: React.FC = () => {
  const {
    isLoginModalOpen,
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
  const [staffUsername, setStaffUsername] = useState('admin');
  const [staffPassword, setStaffPassword] = useState('');

  // Student login state
  const [studentIdentifier, setStudentIdentifier] = useState('6604062610099');
  const [studentPassword, setStudentPassword] = useState('student123');

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
  }, [openLoginModal]);

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

    const cleanId = registerForm.studentId.trim().replace(/^s/i, '');
    if (!cleanId || cleanId.length < 8) {
      setWarningMsg('กรุณากรอกรหัสนักศึกษา 8-13 หลักให้ถูกต้อง');
      return;
    }
    if (!registerForm.name.trim()) {
      setWarningMsg('กรุณากรอกชื่อ-นามสกุลพร้อมคำนำหน้า');
      return;
    }
    if (!registerForm.email.trim() || !registerForm.email.includes('@')) {
      setWarningMsg('กรุณากรอกอีเมลมหาวิทยาลัย (@email.kmutnb.ac.th)');
      return;
    }
    if (!registerForm.phone.trim()) {
      setWarningMsg('กรุณากรอกเบอร์โทรศัพท์สำหรับติดต่อกลับ');
      return;
    }
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
    const cleanUser = staffUsername.trim();

    if (!cleanUser) {
      showToast('กรุณากรอกชื่อผู้ใช้เจ้าหน้าที่', 'warning');
      return;
    }

    if (!staffPassword) {
      showToast('กรุณากรอกรหัสผ่าน', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(cleanUser, staffPassword, 'เจ้าหน้าที่ธุรการ/กรรมการทุน ภาควิชาคณิตศาสตร์');
      if (!result.success) {
        const msg = result.message || 'ชื่อผู้ใช้หรือรหัสผ่านเจ้าหน้าที่ไม่ถูกต้อง';
        setWarningMsg(msg);
        showToast(msg, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast('หากลืมรหัสผ่าน กรุณาติดต่อธุรการภาควิชาคณิตศาสตร์ อาคาร 78 หรือโทร. 02-555-2000 ต่อ 4601-4602', 'info');
  };

  return (
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
                        placeholder="เช่น 6604062610099 หรือ s6604... @email.kmutnb.ac.th"
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
                        placeholder="เช่น 6604062610099"
                        value={registerForm.studentId}
                        onChange={(e) => setRegisterForm({ ...registerForm, studentId: e.target.value })}
                        maxLength={14}
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
                        placeholder="เช่น นายสมคิด มุ่งมั่นวิทยา"
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
                        placeholder="เช่น 089-123-4567"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
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
                        placeholder="s6604062610099@email.kmutnb.ac.th"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
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
                          placeholder="รหัสผ่านอย่างน้อย 6 ตัว"
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
                          placeholder="พิมพ์รหัสผ่านอีกครั้ง"
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
                  ชื่อผู้ใช้เจ้าหน้าที่
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
                    placeholder="กรอกชื่อผู้ใช้ เช่น admin หรือ staff"
                    value={staffUsername}
                    onChange={(e) => {
                      setStaffUsername(e.target.value);
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
  );
};
