import React from 'react';
import { ScholarshipProvider } from './context/ScholarshipContext';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/hero/HeroSection';
import { NewsSection } from './components/news/NewsSection';
import { ScholarshipDirectory } from './components/scholarships/ScholarshipDirectory';
import { StatusTracking } from './components/tracking/StatusTracking';
import { DownloadsFaqSection } from './components/faq/DownloadsFaqSection';
import { Footer } from './components/layout/Footer';

// Modals
import { ScholarshipDetailModal } from './components/scholarships/ScholarshipDetailModal';
import { ApplicationWizardModal } from './components/wizard/ApplicationWizardModal';
import { ApplicationSuccessModal } from './components/wizard/ApplicationSuccessModal';
import { LoginModal } from './components/auth/LoginModal';
import { ToastContainer } from './components/ui/ToastContainer';
import { SupabaseStatusBadge } from './components/ui/SupabaseStatusBadge';

export const App: React.FC = () => {
  return (
    <ScholarshipProvider>
      <div className="app-root">
        {/* Navigation Bar */}
        <Navbar />

        {/* Main Content Sections */}
        <main>
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
        </main>

        {/* Footer */}
        <Footer />

        {/* Modals & Overlays */}
        <ScholarshipDetailModal />
        <ApplicationWizardModal />
        <ApplicationSuccessModal />
        <LoginModal />

        {/* Floating Toasts */}
        <ToastContainer />

        {/* Supabase Status Indicator & Setup Helper */}
        <SupabaseStatusBadge />
      </div>
    </ScholarshipProvider>
  );
};

export default App;
