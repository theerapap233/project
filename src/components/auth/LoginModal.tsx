import React, { useState } from 'react';
import { useScholarship } from '../../context/ScholarshipContext';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, login, showToast } = useScholarship();
  const [username, setUsername] = useState('s6604062610099');
  const [password, setPassword] = useState('••••••••••••');
  const [rememberMe, setRememberMe] = useState(true);

  if (!isLoginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast('กรุณากรอกรหัสนักศึกษา หรือบัญชีผู้ใช้ ICIT', 'warning');
      return;
    }
    login(username.trim());
  };

  const handleGoogleLogin = () => {
    login('s6604062610099', 'นายสมคิด มุ่งมั่นวิทยา');
  };

  return (
    <div className="modal-backdrop open">
      <div className="modal-card" style={{ maxWidth: 460 }}>
        <div className="modal-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
          <div style={{ textAlign: 'center', width: '100%' }}>
            <img 
              src="/logo.png" 
              alt="KMUTNB Mathematics" 
              style={{ width: 68, height: 68, borderRadius: '50%', background: 'white', padding: 2, margin: '0 auto 12px', display: 'block', boxShadow: '0 4px 16px rgba(7, 123, 56, 0.25)' }} 
            />
            <h3 style={{ fontSize: '1.35rem', color: 'var(--navy-900)', marginBottom: 4 }}>
              เข้าสู่ระบบสารสนเทศทุน
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มจพ.
            </p>
          </div>
          <button className="modal-close-btn" onClick={closeLoginModal}>&times;</button>
        </div>

        <div className="modal-body" style={{ paddingTop: 16 }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                บัญชีผู้ใช้เครือข่าย มจพ. (ICIT Account)
              </label>
              <input 
                type="text" 
                className="form-input-light" 
                placeholder="เช่น s6604062610099 หรือชื่อผู้ใช้"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                  รหัสผ่าน (Password)
                </label>
                <a 
                  href="https://account.kmutnb.ac.th" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ fontSize: '0.8rem', color: 'var(--math-green)' }}
                >
                  ลืมรหัสผ่าน?
                </a>
              </div>
              <input 
                type="password" 
                className="form-input-light" 
                placeholder="กรอกรหัสผ่าน ICIT"
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
                สำหรับนักศึกษาและบุคลากร
              </span>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
              เข้าสู่ระบบด้วย ICIT Account
            </button>

            <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0', gap: 12 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>หรือ</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-light)' }} />
            </div>

            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleGoogleLogin}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              เข้าสู่ระบบด้วย Google KMUTNB
            </button>
          </form>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center', background: 'var(--surface-ground)', borderTop: '1px solid var(--border-light)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
            หากพบปัญหาการเข้าสู่ระบบ ติดต่อสำนักคอมพิวเตอร์ ICIT โทร. 02-555-2000 ต่อ 2222
          </p>
        </div>
      </div>
    </div>
  );
};
