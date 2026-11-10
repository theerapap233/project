import React, { useMemo } from 'react';
import { ScholarshipCard } from './ScholarshipCard';
import { useScholarship } from '../../context/ScholarshipContext';


export const ScholarshipDirectory: React.FC = () => {
  const { scholarships } = useScholarship();

  // แยกทุนออกเป็น 2 ส่วนชัดเจน: ทุนภายใน vs ทุนภายนอก
  const internalScholarships = useMemo(() => {
    return scholarships.filter(s => s.scope === 'internal');
  }, [scholarships]);

  const externalScholarships = useMemo(() => {
    return scholarships.filter(s => s.scope === 'external');
  }, [scholarships]);

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

        {/* ส่วนที่ 1: ทุนภายใน */}
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
            {internalScholarships.map(sch => (
              <ScholarshipCard key={sch.id} scholarship={sch} />
            ))}
          </div>
        </div>

        {/* ส่วนที่ 2: ทุนภายนอก */}
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
            {externalScholarships.map(sch => (
              <ScholarshipCard key={sch.id} scholarship={sch} />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};
