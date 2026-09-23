import React, { useState, useEffect } from 'react';
import { useScholarship } from '../../context/ScholarshipContext';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, openLoginModal, closeLoginModal, login, showToast } = useScholarship();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  // รองรับการเปิดด้วยคีย์ลัด Ctrl+Shift+A หรือ Alt+A และ URL Hash #admin หรือ #login
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+A หรือ Alt+A
      if (((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) ||
          (e.altKey && (e.key === 'A' || e.key === 'a'))) {
        e.preventDefault();
        openLoginModal();
      }
    };

    const handleHashCheck = () => {
      if (window.location.hash === '#admin' || window.location.hash === '#login') {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWarningMsg(null);
    const cleanUser = username.trim();

    if (!cleanUser) {
      showToast('กรุณากรอกชื่อผู้ใช้เจ้าหน้าที่', 'warning');
      return;
    }

    // ตรวจสอบหากเป็นรหัสนักศึกษา (ขึ้นต้นด้วย 6 หรือ s6 และตามด้วยตัวเลข)
    const isStudentFormat = /^s?[0-9]{10,13}$/i.test(cleanUser);
    if (isStudentFormat) {
      const msg = 'ระบบเข้าสู่ระบบนี้สำหรับเจ้าหน้าที่และคณะกรรมการพิจารณาทุนเท่านั้น นักศึกษาสามารถสมัครทุนและตรวจสอบสถานะได้โดยตรงโดยไม่ต้องเข้าสู่ระบบ';
      setWarningMsg(msg);
      showToast(msg, 'warning');
      return;
    }

    // อนุญาตเฉพาะบัญชีเจ้าหน้าที่/แอดมิน
    const isAdminAccount = cleanUser.toLowerCase() === 'admin' || 
                           cleanUser.toLowerCase().includes('staff') || 
                           cleanUser.toLowerCase().includes('officer') ||
                           cleanUser.toLowerCase().includes('committee') ||
                           cleanUser.toLowerCase().includes('math');

    if (!isAdminAccount) {
      const msg = 'ไม่พบบัญชีเจ้าหน้าที่นี้ในระบบ กรุณาใช้ชื่อผู้ใช้ "admin" หรือติดต่อผู้ดูแลระบบภาควิชา';
      setWarningMsg(msg);
      showToast(msg, 'error');
      return;
    }

    login(cleanUser, 'เจ้าหน้าที่ธุรการ/กรรมการทุน ภาควิชาคณิตศาสตร์');
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast('หากลืมรหัสผ่าน กรุณาติดต่อธุรการภาควิชาคณิตศาสตร์ อาคาร 78 หรือโทร. 02-555-2000 ต่อ 4601-4602', 'info');
  };

  const selectAdminAccount = () => {
    setUsername('admin');
    setPassword('••••••••••••');
    setWarningMsg(null);
  };

  return (
    <div className="modal-backdrop open">
      <div className="modal-card" style={{ maxWidth: 460 }}>
        <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ 
              width: 58, 
              height: 58, 
              borderRadius: '50%', 
              background: 'linear-gradient(135deg, #077b38, #045a27)', 
              color: 'white',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 12px',
              boxShadow: '0 4px 16px rgba(7, 123, 56, 0.3)' 
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.35rem', color: 'var(--navy-900)', marginBottom: 4 }}>
              เข้าสู่ระบบสำหรับเจ้าหน้าที่
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--kmutnb-orange, #e65100)', fontWeight: 500, margin: '0 0 4px' }}>
              เฉพาะเจ้าหน้าที่และคณะกรรมการพิจารณาทุนเท่านั้น
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              (นักศึกษาสามารถสมัครทุนและตรวจสถานะได้โดยไม่ต้องเข้าสู่ระบบ)
            </p>
          </div>
          <button className="modal-close-btn" onClick={closeLoginModal}>&times;</button>
        </div>

        <div className="modal-body" style={{ paddingTop: 16 }}>
          {warningMsg && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '0.82rem',
              color: '#991B1B',
              marginBottom: 16,
              lineHeight: 1.5
            }}>
              ⚠️ {warningMsg}
            </div>
          )}


          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                ชื่อผู้ใช้เจ้าหน้าที่ (Staff Username)
              </label>
              <input 
                type="text" 
                className="form-input-light" 
                placeholder="กรอกชื่อผู้ใช้ เช่น admin หรือ staff"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (warningMsg) setWarningMsg(null);
                }}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                  รหัสผ่าน (Password)
                </label>
                <a 
                  href="#forgot-password"
                  onClick={handleForgotPassword}
                  style={{ fontSize: '0.8rem', color: 'var(--math-green)', textDecoration: 'none', cursor: 'pointer' }}
                >
                  ลืมรหัสผ่าน?
                </a>
              </div>
              <input 
                type="password" 
                className="form-input-light" 
                placeholder="กรอกรหัสผ่านของคุณ"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: 'var(--navy-700)', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)} 
                />
                จดจำการเข้าสู่ระบบ
              </label>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                คีย์ลัด: Ctrl+Shift+A
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              เข้าสู่ระบบเจ้าหน้าที่
            </button>
          </form>
        </div>


      </div>
    </div>
  );
};
