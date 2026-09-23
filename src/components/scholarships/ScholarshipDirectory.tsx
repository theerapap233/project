import React, { useMemo } from 'react';
import { ScholarshipCard } from './ScholarshipCard';
import { useScholarship } from '../../context/ScholarshipContext';
import { Building2, Globe } from 'lucide-react';

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
    <section className="section" id="scholarships">
      <div className="container" style={{ maxWidth: '1024px' }}>
        {/* Section Header */}
        <div className="section-header">
          <span className="section-tag">Scholarship Directory</span>
          <h2 className="section-title">ทุนการศึกษา ภาควิชาคณิตศาสตร์</h2>
          <p className="section-subtitle">
            จำแนกออกเป็น 2 ส่วนชัดเจน: <strong>ส่วนที่ 1 ทุนการศึกษาภายใน</strong> (มหาวิทยาลัย / คณะ / ภาควิชา) และ <strong>ส่วนที่ 2 ทุนการศึกษาภายนอก</strong> (มูลนิธิ / องค์กรเอกชน / ชมรมศิษย์เก่า)
          </p>
        </div>


        {/* ========================================================= */}
        {/* ส่วนที่ 1: ทุนภายใน (Internal Scholarships)               */}
        {/* ========================================================= */}
        <div className="scope-block internal" id="internal-scholarships">
          <div className="scope-block-header">
            <div className="scope-block-title-area">

              <h3 className="scope-block-title">
                ทุนการศึกษาภายใน
              </h3>
              <p className="scope-block-desc">
                ทุนสนับสนุนโดยตรงจากมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (มจพ.), คณะวิทยาศาสตร์ประยุกต์ และกองทุนพัฒนาภาควิชาคณิตศาสตร์ เช่น ทุนเรียนดีเด่น, ทุนช่วยเหลือนักศึกษาขาดแคลนทุนทรัพย์, ทุนผู้ช่วยสอน (TA) และทุนกิจกรรมจิตสาธารณะ
              </p>
            </div>

          </div>

          <div className="scholarship-grid">
            {internalScholarships.map(sch => (
              <ScholarshipCard key={sch.id} scholarship={sch} />
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* ส่วนที่ 2: ทุนภายนอก (External Scholarships)               */}
        {/* ========================================================= */}
        <div className="scope-block external" id="external-scholarships">
          <div className="scope-block-header">
            <div className="scope-block-title-area">

              <h3 className="scope-block-title">
                ทุนการศึกษาภายนอก
              </h3>
              <p className="scope-block-desc">
                ทุนสนับสนุนจากหน่วยงานภายนอก มูลนิธิเพื่อการศึกษา องค์กรพันธมิตรภาคอุตสาหกรรม และชมรมศิษย์เก่าภาควิชาคณิตศาสตร์ มจพ. เพื่อขยายโอกาสทางการศึกษา พัฒนาทักษะวิชาชีพ และส่งเสริมนักศึกษาในมิติต่าง ๆ
              </p>
            </div>

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
