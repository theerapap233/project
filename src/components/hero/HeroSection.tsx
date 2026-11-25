import React from 'react';
import { useScholarship } from '../../context/ScholarshipContext';

export const HeroSection: React.FC = () => {
  const { scrollToSection, siteSettings } = useScholarship();

  return (
    <section className="hero-section" id="hero">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-content">
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
