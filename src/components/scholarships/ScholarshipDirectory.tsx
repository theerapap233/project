import React, { useState, useMemo } from 'react';
import { ScholarshipCard } from './ScholarshipCard';
import { useScholarship } from '../../context/ScholarshipContext';
import { Building2, Globe, Search } from 'lucide-react';

export const ScholarshipDirectory: React.FC = () => {
  const { scholarships } = useScholarship();
  const [searchQuery, setSearchQuery] = useState('');

  // แยกทุนออกเป็น 2 ส่วนชัดเจน: ทุนภายใน vs ทุนภายนอก (พร้อมรองรับการค้นหา)
  const internalScholarships = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return scholarships
      .filter(s => s.scope === 'internal')
      .filter(sch => {
        if (!q) return true;
        return (
          sch.title.toLowerCase().includes(q) ||
          sch.description.toLowerCase().includes(q) ||
          sch.categoryName.toLowerCase().includes(q) ||
          sch.fundingSource.toLowerCase().includes(q) ||
          sch.targetMajors.some(m => m.toLowerCase().includes(q))
        );
      });
  }, [scholarships, searchQuery]);

  const externalScholarships = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return scholarships
      .filter(s => s.scope === 'external')
      .filter(sch => {
        if (!q) return true;
        return (
          sch.title.toLowerCase().includes(q) ||
          sch.description.toLowerCase().includes(q) ||
          sch.categoryName.toLowerCase().includes(q) ||
          sch.fundingSource.toLowerCase().includes(q) ||
          sch.targetMajors.some(m => m.toLowerCase().includes(q))
        );
      });
  }, [scholarships, searchQuery]);

  return (
    <section className="section" id="scholarships">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-tag">Scholarship Directory</span>
          <h2 className="section-title">ทุนการศึกษา ภาควิชาคณิตศาสตร์</h2>
          <p className="section-subtitle">
            จำแนกออกเป็น 2 ส่วนชัดเจน: <strong>ส่วนที่ 1 ทุนการศึกษาภายใน</strong> (มหาวิทยาลัย / คณะ / ภาควิชา) และ <strong>ส่วนที่ 2 ทุนการศึกษาภายนอก</strong> (มูลนิธิ / องค์กรเอกชน / ชมรมศิษย์เก่า)
          </p>
        </div>

        {/* Quick Jump Links & Search Bar */}
        <div className="scholarship-toolbar">
          <div className="search-input-group">
            <Search size={18} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="ค้นหาชื่อทุน แหล่งทุน หรือคุณสมบัติ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="search-clear-btn"
                title="ล้างคำค้นหา"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* ส่วนที่ 1: ทุนภายใน (Internal Scholarships)               */}
        {/* ========================================================= */}
        <div className="scope-block internal" id="internal-scholarships">
          <div className="scope-block-header">
            <div className="scope-block-title-area">
              <div className="scope-block-badge internal">
                <Building2 size={18} />
                <span>ส่วนที่ 1 • ทุนการศึกษาภายใน (Internal Scholarships)</span>
              </div>
              <h3 className="scope-block-title">
                ทุนภายในมหาวิทยาลัย / คณะวิทยาศาสตร์ประยุกต์ / ภาควิชาคณิตศาสตร์
              </h3>
              <p className="scope-block-desc">
                ทุนสนับสนุนโดยตรงจากมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (มจพ.), คณะวิทยาศาสตร์ประยุกต์ และกองทุนพัฒนาภาควิชาคณิตศาสตร์ เช่น ทุนเรียนดีเด่น, ทุนช่วยเหลือนักศึกษาขาดแคลนทุนทรัพย์, ทุนผู้ช่วยสอน (TA) และทุนกิจกรรมจิตสาธารณะ
              </p>
            </div>
            <div className="scope-block-stat internal">
              <span className="scope-block-stat-num">{internalScholarships.length}</span>
              <span className="scope-block-stat-label">ทุนที่เปิดรับสมัคร</span>
            </div>
          </div>

          <div className="scholarship-grid">
            {internalScholarships.length === 0 ? (
              <div className="scope-empty-state">
                <p>ไม่พบรายการทุนภายในที่ตรงกับคำค้นหา "{searchQuery}"</p>
                <button className="btn btn-secondary btn-sm" onClick={() => setSearchQuery('')}>
                  ล้างคำค้นหา
                </button>
              </div>
            ) : (
              internalScholarships.map(sch => (
                <ScholarshipCard key={sch.id} scholarship={sch} />
              ))
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* ส่วนที่ 2: ทุนภายนอก (External Scholarships)               */}
        {/* ========================================================= */}
        <div className="scope-block external" id="external-scholarships">
          <div className="scope-block-header">
            <div className="scope-block-title-area">
              <div className="scope-block-badge external">
                <Globe size={18} />
                <span>ส่วนที่ 2 • ทุนการศึกษาภายนอก (External Scholarships)</span>
              </div>
              <h3 className="scope-block-title">
                ทุนภายนอก (มูลนิธิ / องค์กรเอกชน / ชมรมศิษย์เก่า)
              </h3>
              <p className="scope-block-desc">
                ทุนสนับสนุนจากหน่วยงานภายนอก มูลนิธิเพื่อการศึกษา องค์กรพันธมิตรภาคอุตสาหกรรม และชมรมศิษย์เก่าภาควิชาคณิตศาสตร์ มจพ. เพื่อขยายโอกาสทางการศึกษา พัฒนาทักษะวิชาชีพ และส่งเสริมนักศึกษาในมิติต่าง ๆ
              </p>
            </div>
            <div className="scope-block-stat external">
              <span className="scope-block-stat-num">{externalScholarships.length}</span>
              <span className="scope-block-stat-label">ทุนที่เปิดรับสมัคร</span>
            </div>
          </div>

          <div className="scholarship-grid">
            {externalScholarships.length === 0 ? (
              <div className="scope-empty-state">
                <p>ไม่พบรายการทุนภายนอกที่ตรงกับคำค้นหา "{searchQuery}"</p>
                <button className="btn btn-secondary btn-sm" onClick={() => setSearchQuery('')}>
                  ล้างคำค้นหา
                </button>
              </div>
            ) : (
              externalScholarships.map(sch => (
                <ScholarshipCard key={sch.id} scholarship={sch} />
              ))
            )}
          </div>
        </div>

      </div>
    </section>
  );
};
