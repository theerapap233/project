import React, { useMemo, useState } from 'react';
import { ScholarshipCard } from './ScholarshipCard';
import { useScholarship } from '../../context/ScholarshipContext';
import { useMyApplications } from '../../hooks/useMyApplications';
import { applicationMatchesScholarshipPeriod } from '../../utils/applicationPeriod';


export const ScholarshipDirectory: React.FC = () => {
  const { scholarships } = useScholarship();
  const { isStudent, myApplications } = useMyApplications();
  const [showAllInternal, setShowAllInternal] = useState(false);
  const [showAllExternal, setShowAllExternal] = useState(false);

  const visibleScholarships = useMemo(() => {
    if (!isStudent) return scholarships;
    const appliedScholarshipIds = new Set(scholarships
      .filter(scholarship => myApplications.some(application =>
        application.scholarshipId === scholarship.id &&
        applicationMatchesScholarshipPeriod(application, scholarship)
      ))
      .map(scholarship => scholarship.id));
    return scholarships.filter(scholarship => !appliedScholarshipIds.has(scholarship.id));
  }, [scholarships, isStudent, myApplications]);

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
          <h2 className="section-title">ทุนการศึกษา ภาควิชาคณิตศาสตร์</h2>
          <p className="section-subtitle">
            รวมรายการทุนการศึกษาของภาควิชาคณิตศาสตร์ มจพ. ทั้งทุนภายในมหาวิทยาลัยและทุนสนับสนุนจากองค์กรภายนอก
          </p>
        </div>

        {isStudent && myApplications.length > 0 && visibleScholarships.length === 0 && (
          <p className="section-subtitle">
            สมัครทุนที่แสดงครบแล้ว สามารถตรวจสอบสถานะได้ในเมนูใบสมัครของฉัน
          </p>
        )}

        {/* ส่วนที่ 1: ทุนภายใน */}
        {internalScholarships.length > 0 && (
          <div className="scholarship-scope-group" id="internal-scholarships">
            <div className="scope-group-header">
              <div className="scope-badge-pill internal">
                <span>🏛️ ทุนการศึกษาภายใน (มจพ. / คณะ / ภาควิชา)</span>
                <span className="scope-count">{internalScholarships.length} ทุน</span>
              </div>
              <p className="scope-group-desc">
                ทุนสนับสนุนโดยตรงจากมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ, คณะวิทยาศาสตร์ประยุกต์ และกองทุนพัฒนาภาควิชาคณิตศาสตร์
              </p>
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
                <span>🤝 ทุนการศึกษาภายนอก (มูลนิธิ / องค์กรเอกชน / ศิษย์เก่า)</span>
                <span className="scope-count">{externalScholarships.length} ทุน</span>
              </div>
              <p className="scope-group-desc">
                ทุนสนับสนุนจากหน่วยงานภายนอก มูลนิธิเพื่อการศึกษา และชมรมศิษย์เก่าภาควิชาคณิตศาสตร์ มจพ.
              </p>
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
