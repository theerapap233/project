import React, { useState, useMemo } from 'react';
import { ScholarshipCategory } from '../../types/scholarship';
import { ScholarshipCard } from './ScholarshipCard';
import { useScholarship } from '../../context/ScholarshipContext';

const CATEGORIES: { key: ScholarshipCategory; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'academic', label: 'ทุนเรียนดี / วิชาการ' },
  { key: 'need', label: 'ทุนขาดแคลนทุนทรัพย์' },
  { key: 'work', label: 'ทุนผู้ช่วยสอน / TA' },
  { key: 'alumni', label: 'ทุนศิษย์เก่า' },
  { key: 'activity', label: 'ทุนจิตสาธารณะ' }
];

export const ScholarshipDirectory: React.FC = () => {
  const { scholarships, activeCategory, setActiveCategory } = useScholarship();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredScholarships = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return scholarships.filter(sch => {
      const matchCategory = activeCategory === 'all' || sch.category === activeCategory;
      const matchSearch = !q ||
        sch.title.toLowerCase().includes(q) ||
        sch.description.toLowerCase().includes(q) ||
        sch.categoryName.toLowerCase().includes(q) ||
        sch.targetMajors.some(m => m.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [scholarships, activeCategory, searchQuery]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
  };

  return (
    <section className="section" id="scholarships">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Scholarship Directory</span>
          <h2 className="section-title">รายการทุนการศึกษาภาควิชาคณิตศาสตร์</h2>
          <p className="section-subtitle">เลือกดูประเภททุนการศึกษาที่ตรงกับคุณสมบัติและเป้าหมายของคุณ</p>
        </div>

        {/* Filter Controls */}
        <div className="filter-bar">
          <div className="search-input-group">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="พิมพ์ชื่อทุน หรือคำสำคัญ เช่น เรียนดี, TA, ขาดแคลน..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-pills">
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                className={`filter-btn ${activeCategory === cat.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scholarship Cards Grid */}
        <div className="scholarship-grid">
          {filteredScholarships.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '48px 24px',
              background: 'white',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-subtle)'
            }}>
              <p style={{ fontSize: '1.1rem', color: 'var(--navy-600)', marginBottom: '12px' }}>
                ไม่พบรายการทุนการศึกษาที่ตรงกับเงื่อนไขการค้นหา
              </p>
              <button className="btn btn-secondary btn-sm" onClick={handleClearFilters}>
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          ) : (
            filteredScholarships.map(sch => (
              <ScholarshipCard key={sch.id} scholarship={sch} />
            ))
          )}
        </div>
      </div>
    </section>
  );
};
