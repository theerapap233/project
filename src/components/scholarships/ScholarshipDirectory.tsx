import React, { useState, useMemo } from 'react';
import { ScholarshipCategory } from '../../types/scholarship';
import { ScholarshipCard } from './ScholarshipCard';
import { useScholarship } from '../../context/ScholarshipContext';
import { Building2, Globe, Sparkles } from 'lucide-react';

const CATEGORIES: { key: ScholarshipCategory; label: string }[] = [
  { key: 'all', label: 'ทุกประเภททุน' },
  { key: 'academic', label: 'ทุนเรียนดี / วิชาการ' },
  { key: 'need', label: 'ทุนขาดแคลนทุนทรัพย์' },
  { key: 'work', label: 'ทุนผู้ช่วยสอน / TA' },
  { key: 'alumni', label: 'ทุนศิษย์เก่า' },
  { key: 'activity', label: 'ทุนจิตสาธารณะ' }
];

export const ScholarshipDirectory: React.FC = () => {
  const { scholarships, activeScope, setActiveScope, activeCategory, setActiveCategory } = useScholarship();
  const [searchQuery, setSearchQuery] = useState('');

  // นับจำนวนทุนในแต่ละกลุ่มใหญ่
  const scopeCounts = useMemo(() => {
    const internal = scholarships.filter(s => s.scope === 'internal').length;
    const external = scholarships.filter(s => s.scope === 'external').length;
    return { all: scholarships.length, internal, external };
  }, [scholarships]);

  const filteredScholarships = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return scholarships.filter(sch => {
      const matchScope = activeScope === 'all' || sch.scope === activeScope;
      const matchCategory = activeCategory === 'all' || sch.category === activeCategory;
      const matchSearch = !q ||
        sch.title.toLowerCase().includes(q) ||
        sch.description.toLowerCase().includes(q) ||
        sch.categoryName.toLowerCase().includes(q) ||
        sch.fundingSource.toLowerCase().includes(q) ||
        sch.targetMajors.some(m => m.toLowerCase().includes(q));
      return matchScope && matchCategory && matchSearch;
    });
  }, [scholarships, activeScope, activeCategory, searchQuery]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setActiveScope('all');
    setActiveCategory('all');
  };

  return (
    <section className="section" id="scholarships">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Scholarship Directory</span>
          <h2 className="section-title">ทุนการศึกษา ภาควิชาคณิตศาสตร์</h2>
          <p className="section-subtitle">
            จำแนกตาม 2 กลุ่มใหญ่: ทุนภายใน (มหาวิทยาลัย/คณะ/ภาควิชา) และทุนภายนอก (มูลนิธิ/องค์กรพันธมิตร/ศิษย์เก่า)
          </p>
        </div>

        {/* 2 กลุ่มใหญ่: ทุนภายใน vs ทุนภายนอก (Scope Selector) */}
        <div className="scope-tabs-wrapper">
          <button 
            className={`scope-tab-btn ${activeScope === 'all' ? 'active' : ''}`}
            onClick={() => setActiveScope('all')}
          >
            <Sparkles size={18} />
            <div className="scope-tab-text">
              <span className="scope-tab-title">ทุนทั้งหมด</span>
              <span className="scope-tab-desc">รวมทุกแหล่งทุนสนับสนุน</span>
            </div>
            <span className="scope-count-badge">{scopeCounts.all}</span>
          </button>

          <button 
            className={`scope-tab-btn internal ${activeScope === 'internal' ? 'active' : ''}`}
            onClick={() => setActiveScope('internal')}
          >
            <Building2 size={18} />
            <div className="scope-tab-text">
              <span className="scope-tab-title">ทุนภายใน</span>
              <span className="scope-tab-desc">มจพ. / คณะวิทยาศาสตร์ประยุกต์ / ภาควิชา</span>
            </div>
            <span className="scope-count-badge">{scopeCounts.internal}</span>
          </button>

          <button 
            className={`scope-tab-btn external ${activeScope === 'external' ? 'active' : ''}`}
            onClick={() => setActiveScope('external')}
          >
            <Globe size={18} />
            <div className="scope-tab-text">
              <span className="scope-tab-title">ทุนภายนอก</span>
              <span className="scope-tab-desc">มูลนิธิ / องค์กรเอกชน / ชมรมศิษย์เก่า</span>
            </div>
            <span className="scope-count-badge">{scopeCounts.external}</span>
          </button>
        </div>

        {/* Search Bar & Category Filter Controls */}
        <div className="filter-bar">
          <div className="search-input-group">
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--text-muted)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="ค้นหาชื่อทุน แหล่งทุน หรือคุณสมบัติ เช่น เรียนดี, TA, ศิษย์เก่า, ขาดแคลน..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.2rem', padding: '0 8px' }}
              >
                &times;
              </button>
            )}
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

        {/* Active Filters Indicator */}
        {(activeScope !== 'all' || activeCategory !== 'all' || searchQuery) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, padding: '8px 16px', background: 'var(--surface-alt)', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', color: 'var(--navy-700)' }}>
            <div>
              กำลังแสดง: <strong>{activeScope === 'all' ? 'ทุนทุกกลุ่ม' : activeScope === 'internal' ? 'เฉพาะทุนภายใน' : 'เฉพาะทุนภายนอก'}</strong>
              {activeCategory !== 'all' && <span> • หมวดหมู่: <strong>{CATEGORIES.find(c => c.key === activeCategory)?.label}</strong></span>}
              {searchQuery && <span> • ค้นหา: "<strong>{searchQuery}</strong>"</span>}
              <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>({filteredScholarships.length} รายการ)</span>
            </div>
            <button 
              onClick={handleClearFilters}
              style={{ background: 'none', border: 'none', color: 'var(--kmutnb-orange)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
            >
              รีเซ็ตตัวกรอง
            </button>
          </div>
        )}

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
