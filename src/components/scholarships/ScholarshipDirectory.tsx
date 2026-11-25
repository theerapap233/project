import React, { useMemo, useState } from 'react';
import { ScholarshipCard } from './ScholarshipCard';
import { useScholarship } from '../../context/ScholarshipContext';


export const ScholarshipDirectory: React.FC = () => {
  const { scholarships } = useScholarship();
  const [showAllInternal, setShowAllInternal] = useState(false);
  const [showAllExternal, setShowAllExternal] = useState(false);

  // แสดงทุนทั้งหมด รวมทุนที่นักศึกษาสมัครไปแล้ว (การ์ดจะขึ้นป้าย "สมัครแล้ว" และสถานะแทนปุ่มสมัคร)
  const visibleScholarships = scholarships;

  // แยกทุนออกเป็น 2 ส่วนชัดเจน: ทุนภายใน vs ทุนภายนอก
  const internalScholarships = useMemo(() => {
    return visibleScholarships.filter(s => s.scope === 'internal');
  }, [visibleScholarships]);

  const externalScholarships = useMemo(() => {
    return visibleScholarships.filter(s => s.scope === 'external');
  }, [visibleScholarships]);
  const displayedInternalScholarships = showAllInternal ? internalScholarships : internalScholarships.slice(0, 3);
  const displayedExternalScholarships = showAllExternal ? externalScholarships : externalScholarships.slice(0, 3);

  return (
    <section className="section scholarship-section-minimal" id="scholarships">
      <div className="container" style={{ maxWidth: '1024px' }}>
        {/* Section Header */}
        <div className="section-header">
          <span className="section-tag-minimal">Scholarship Directory</span>
          <h2 className="section-title">ทุนการศึกษา</h2>
        </div>

        {/* ส่วนที่ 1: ทุนภายใน */}
        {internalScholarships.length > 0 && (
          <div className="scholarship-scope-group" id="internal-scholarships">
            <div className="scope-group-header">
              <div className="scope-badge-pill internal">
                <span>ทุนภายใน</span>
                <span className="scope-count">{internalScholarships.length} ทุน</span>
              </div>
            </div>
            <div className="scholarship-grid">
              {displayedInternalScholarships.map(sch => (
                <ScholarshipCard key={sch.id} scholarship={sch} />
              ))}
            </div>
            {internalScholarships.length > 3 && (
              <button
                type="button"
                className="section-view-more"
                aria-expanded={showAllInternal}
                onClick={() => setShowAllInternal(showAll => !showAll)}
              >
                {showAllInternal ? 'ย่อรายการ' : 'ดูเพิ่มเติม'}
              </button>
            )}
          </div>
        )}

        {/* ส่วนที่ 2: ทุนภายนอก */}
        {externalScholarships.length > 0 && (
          <div className="scholarship-scope-group" id="external-scholarships" style={{ marginTop: 44 }}>
            <div className="scope-group-header">
              <div className="scope-badge-pill external">
                <span>ทุนภายนอก</span>
                <span className="scope-count">{externalScholarships.length} ทุน</span>
              </div>
            </div>
            <div className="scholarship-grid">
              {displayedExternalScholarships.map(sch => (
                <ScholarshipCard key={sch.id} scholarship={sch} />
              ))}
            </div>
            {externalScholarships.length > 3 && (
              <button
                type="button"
                className="section-view-more"
                aria-expanded={showAllExternal}
                onClick={() => setShowAllExternal(showAll => !showAll)}
              >
                {showAllExternal ? 'ย่อรายการ' : 'ดูเพิ่มเติม'}
              </button>
            )}
          </div>
        )}

      </div>
    </section>
  );
};
