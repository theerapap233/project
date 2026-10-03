import React from 'react';
import { useScholarship } from '../../context/ScholarshipContext';

export const HeroSection: React.FC = () => {
  const { scrollToSection, siteSettings } = useScholarship();



  return (
    <section className="hero-section" id="hero">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
            <div className="hero-badge">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              ปีการศึกษา {siteSettings.semester}/{siteSettings.academicYear}
            </div>
            <h1 className="hero-title" style={{ whiteSpace: 'pre-line' }}>
              {siteSettings.heroTitle}
            </h1>
            <p className="hero-desc">
              {siteSettings.heroSubtitle}
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={() => scrollToSection('scholarships')}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                ค้นหาทุนที่เปิดรับ
              </button>
              <button className="btn btn-dark" onClick={() => scrollToSection('tracking')}>
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ติดตามผลการสมัคร
              </button>
            </div>
          </div>

          {/* Hero Visual Area with Cute Minimalist Badges and Micro-Animations */}
          <div className="hero-visual-wrapper">
            {/* Soft Pastel Glow Backdrop */}
            <div className="hero-glow-backdrop" />

            {/* Floating Cute Math Badges */}
            <div className="hero-chip-badge chip-1" title="Mathematics">
              <span>π</span>
            </div>
            <div className="hero-chip-badge chip-2" title="Infinity">
              <span>∞</span>
            </div>
            <div className="hero-chip-badge chip-3" title="Summation">
              <span>∑</span>
            </div>

            {/* Floating Glassmorphism Status Card Top-Left */}
            <div className="hero-floating-card card-top-left">
              <div className="card-icon-pill card-icon-green">
                <span>🎓</span>
              </div>
              <div>
                <div className="card-text-title">ทุนการศึกษาคณิตศาสตร์</div>
                <div className="card-text-sub">
                  <span className="pulse-dot"></span>
                  <span>เปิดรับสมัครอยู่</span>
                </div>
              </div>
            </div>

            {/* Floating Glassmorphism Status Card Bottom-Right */}
            <div className="hero-floating-card card-bottom-right">
              <div className="card-icon-pill card-icon-orange">
                <span>📚</span>
              </div>
              <div>
                <div className="card-text-title">ครอบคลุมทุกประเภททุน</div>
                <div className="card-text-sub">ทุนเรียนดี • ขาดแคลน </div>
              </div>
            </div>

            {/* Cute Cartoon Student Illustration */}
            <img
              src="/hero-cartoon2.png"
              alt="Cartoon Student Scholarship Hero"
              className="hero-student-img"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
