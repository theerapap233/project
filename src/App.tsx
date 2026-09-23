import React from 'react';
import { ScholarshipProvider, useScholarship } from './context/ScholarshipContext';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/hero/HeroSection';
import { NewsSection } from './components/news/NewsSection';
import { ScholarshipDirectory } from './components/scholarships/ScholarshipDirectory';
import { StatusTracking } from './components/tracking/StatusTracking';
import { DownloadsFaqSection } from './components/faq/DownloadsFaqSection';
import { Footer } from './components/layout/Footer';
import { AdminSection } from './components/admin/AdminSection';
import { PreviewBanner } from './components/ui/PreviewBanner';

// Modals
import { ScholarshipDetailModal } from './components/scholarships/ScholarshipDetailModal';
import { ApplicationWizardModal } from './components/wizard/ApplicationWizardModal';
import { ApplicationSuccessModal } from './components/wizard/ApplicationSuccessModal';
import { LoginModal } from './components/auth/LoginModal';
import { LogoutModal } from './components/auth/LogoutModal';
import { ToastContainer } from './components/ui/ToastContainer';


const MainContent: React.FC = () => {
  const { currentUser, isAdminActive, isPreviewMode } = useScholarship();
  const isStaffMode = Boolean(currentUser && isAdminActive);

  return (
    <div className="app-root">
      {/* Top Banner when in Preview Mode */}
      {isStaffMode && isPreviewMode && <PreviewBanner />}

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
            {/* Section 0: Hero Section (หน้าหลัก) */}
            <HeroSection />

            {/* Section 1: News & Announcements (ข่าวสาร) */}
            <NewsSection />

            {/* Section 2: Scholarships Catalog */}
            <ScholarshipDirectory />

            {/* Section 3: Status Tracking */}
            <StatusTracking />

            {/* Section 4: Downloads & FAQ */}
            <DownloadsFaqSection />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals & Overlays */}
      <ScholarshipDetailModal />
      <ApplicationWizardModal />
      <ApplicationSuccessModal />
      <LoginModal />
      <LogoutModal />

      {/* Floating Toasts */}
      <ToastContainer />

      {/* Supabase Status Indicator & Setup Helper */}

    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ScholarshipProvider>
      <MainContent />
    </ScholarshipProvider>
  );
};

export default App;
