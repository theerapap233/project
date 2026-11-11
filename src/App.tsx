import React from 'react';
import { ScholarshipProvider, useScholarship } from './context/ScholarshipContext';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/hero/HeroSection';
import { NewsSection } from './components/news/NewsSection';
import { ScholarshipDirectory } from './components/scholarships/ScholarshipDirectory';
import { DownloadsSection } from './components/downloads/DownloadsSection';
import { Footer } from './components/layout/Footer';
import { AdminSection } from './components/admin/AdminSection';
import { PreviewBanner } from './components/ui/PreviewBanner';

// Modals
import { ScholarshipDetailModal } from './components/scholarships/ScholarshipDetailModal';
import { ApplicationWizardModal } from './components/wizard/ApplicationWizardModal';
import { ApplicationSuccessModal } from './components/wizard/ApplicationSuccessModal';
import { MyApplicationsModal } from './components/applications/MyApplicationsModal';
import { MyApplicationsBanner } from './components/applications/MyApplicationsBanner';
import { LoginModal } from './components/auth/LoginModal';
import { LogoutModal } from './components/auth/LogoutModal';
import { ToastContainer } from './components/ui/ToastContainer';
import { AiChatBot } from './components/chatbot/AiChatBot';


const MainContent: React.FC = () => {
  const { currentUser, isAdminActive, isPreviewMode, isMyApplicationsOpen } = useScholarship();
  const isStaffMode = Boolean(currentUser && isAdminActive);

  return (
    <div className="app-root">
      {/* Floating mode switcher for staff */}
      {isStaffMode && <PreviewBanner />}

      {/* Navigation Bar */}
      <Navbar />

      {/* Main Content Sections */}
      <main>
        {isStaffMode && !isPreviewMode ? (
          /* เจ้าหน้าที่มีระบบจัดการเว็บไซต์และทุนการศึกษา */
          <AdminSection />
        ) : (
          /* หน้าเว็บไซต์สำหรับนักศึกษาและบุคคลทั่วไป (รวมถึงโหมด Preview ของเจ้าหน้าที่) */
          <>
            {/* แถบสรุปสถานะใบสมัคร (แสดงเฉพาะนักศึกษาที่มีใบสมัคร) */}
            <MyApplicationsBanner />

            {/* Section 0: Hero Section (หน้าหลัก) */}
            <HeroSection />

            {/* Section 1: News & Announcements (ข่าวสาร) */}
            <NewsSection />

            {/* Section 2: Scholarships Catalog */}
            <ScholarshipDirectory />

            {/* Section 3: Documents & Downloads */}
            <DownloadsSection />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals & Overlays */}
      <ScholarshipDetailModal />
      <ApplicationWizardModal />
      <ApplicationSuccessModal />
      <MyApplicationsModal />
      <LoginModal />
      <LogoutModal />

      {/* Floating Toasts */}
      <ToastContainer />

      {/* AI Chatbot (ผู้ช่วยตอบคำถามแทนส่วน FAQ) */}
      {(!isStaffMode || isPreviewMode) && (
        /* ซ่อนปุ่มแชตชั่วคราวขณะเปิดหน้าต่างใบสมัครของฉัน (ไม่ unmount เพื่อเก็บประวัติแชตไว้) */
        <div style={isMyApplicationsOpen ? { display: 'none' } : undefined}>
          <AiChatBot />
        </div>
      )}

      {/* Supabase Status Indicator & Setup Helper */}

    </div>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application Error:', error, errorInfo);
  }

  handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: "'Sarabun', sans-serif",
          background: '#f8fafc',
          color: '#1e293b',
          textAlign: 'center'
        }}>
          <div style={{
            background: '#ffffff',
            padding: '36px 40px',
            borderRadius: 16,
            boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
            maxWidth: 520,
            width: '100%',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 8px 0', color: '#0f172a' }}>
              เกิดข้อผิดพลาดในการโหลดหน้าเว็บ
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 20 }}>
              ระบบพบข้อผิดพลาดบางประการ: {this.state.error?.message || 'ไม่สามารถแสดงผลได้'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                โหลดหน้านี้ใหม่
              </button>
              <button
                onClick={this.handleReset}
                style={{
                  background: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '10px 20px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
              >
                ล้างแคชและเริ่มใหม่
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ScholarshipProvider>
        <MainContent />
      </ScholarshipProvider>
    </ErrorBoundary>
  );
};

export default App;
