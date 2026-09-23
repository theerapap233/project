import React, { useState, useEffect } from 'react';
import { useScholarship } from '../../context/ScholarshipContext';
import { ApplicationFormData, UploadedFiles } from '../../types/application';

const INITIAL_FORM: ApplicationFormData = {
  scholarshipId: '',
  studentId: '6604062610099',
  fullName: 'นายสมคิด มุ่งมั่นวิทยา',
  nickname: 'คิด',
  major: 'คณิตศาสตร์ประยุกต์',
  year: 'ปี 2',
  gpax: 3.45,
  phone: '089-123-4567',
  email: 's6604062610099@kmutnb.ac.th',
  address: '1518 ถ.ประชาราษฎร์ 1 แขวงวงศ์สว่าง เขตบางซื่อ กรุงเทพฯ 10800',
  isIdCardAddress: true,
  idCardProvince: 'กรุงเทพมหานคร',
  
  fatherName: 'นายประสิทธิ์ มุ่งมั่นวิทยา',
  fatherPhone: '081-999-8888',
  fatherJob: 'รับจ้างทั่วไป',
  fatherIncome: 12000,
  fatherAlive: 'alive',
  
  motherName: 'นางมาลี มุ่งมั่นวิทยา',
  motherPhone: '081-777-6666',
  motherJob: 'ค้าขาย',
  motherIncome: 8000,
  motherAlive: 'alive',
  
  parentsRelation: 'together',
  familyIncome: 240000,
  siblings: 2,
  
  sponsor: ['father', 'mother'],
  sponsorOther: '',
  loanStatus: 'none',
  loanAmount: 0,
  
  hasPartTimeJob: false,
  partTimeJobLocation: '',
  partTimeJobIncome: 0,
  
  hasActivities: true,
  activities: 'ค่ายคณิตศาสตร์สัญจร มจพ.',
  activityRole: 'สวัสดิการ',
  volunteerHours: 35,
  
  reason: 'ครอบครัวมีภาระค่าใช้จ่ายสูง มีพี่น้องกำลังศึกษาอยู่ 2 คน ข้าพเจ้าต้องการนำเงินทุนการศึกษามาแบ่งเบาภาระค่าใช้จ่ายในการครองชีพ ค่าอุปกรณ์การเรียน และตั้งใจที่จะศึกษาต่อยอดเพื่อนำความรู้ด้านคณิตศาสตร์ไปประกอบอาชีพและช่วยเหลือสังคมต่อไป',
  consent: false
};

export const ApplicationWizardModal: React.FC = () => {
  const { 
    isWizardModalOpen, 
    closeApplicationModal, 
    scholarships, 
    selectedScholarshipIdForApply, 
    submitApplication, 
    showToast 
  } = useScholarship();

  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<ApplicationFormData>(INITIAL_FORM);
  const [files] = useState<UploadedFiles>({
    doc1: null,
    doc2: null,
    doc3: null
  });

  useEffect(() => {
    if (isWizardModalOpen) {
      setStep(1);
      if (selectedScholarshipIdForApply) {
        setFormData(prev => ({ ...prev, scholarshipId: selectedScholarshipIdForApply }));
      } else if (scholarships.length > 0) {
        setFormData(prev => ({ ...prev, scholarshipId: scholarships[0].id }));
      }
    }
  }, [isWizardModalOpen, selectedScholarshipIdForApply, scholarships]);

  if (!isWizardModalOpen) return null;

  // File upload simulation removed

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.studentId || formData.studentId.length < 8) {
        showToast('กรุณากรอกรหัสนักศึกษาให้ถูกต้อง', 'warning');
        return false;
      }
      if (!formData.fullName.trim()) {
        showToast('กรุณาระบุชื่อ-นามสกุลนักศึกษา', 'warning');
        return false;
      }
      if (isNaN(formData.gpax) || formData.gpax < 0 || formData.gpax > 4) {
        showToast('กรุณากรอกเกรดเฉลี่ยสะสม (GPAX) ระหว่าง 0.00 - 4.00', 'warning');
        return false;
      }
      if (!formData.phone.trim()) {
        showToast('กรุณากรอกเบอร์โทรศัพท์สำหรับติดต่อ', 'warning');
        return false;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        showToast('กรุณากรอกอีเมลให้ถูกต้อง', 'warning');
        return false;
      }
      if (!formData.address.trim()) {
        showToast('กรุณากรอกที่อยู่ปัจจุบัน', 'warning');
        return false;
      }
    }

    if (currentStep === 2) {
      if (formData.sponsor.length === 0) {
        showToast('กรุณาเลือกผู้รับผิดชอบค่าใช้จ่ายในการศึกษาอย่างน้อย 1 ข้อ', 'warning');
        return false;
      }
      if (formData.hasPartTimeJob && !formData.partTimeJobLocation.trim()) {
        showToast('กรุณาระบุสถานที่ทำงานพิเศษ', 'warning');
        return false;
      }
    }

    if (currentStep === 3) {
      if (formData.hasActivities && !formData.activities.trim()) {
        showToast('กรุณาระบุชื่อกิจกรรม', 'warning');
        return false;
      }
    }

    if (currentStep === 4) {
      if (!formData.reason || formData.reason.trim().length < 10) {
        showToast('กรุณากรอกเหตุผลและความจำเป็นในการขอรับทุนอย่างน้อย 10 ตัวอักษร', 'warning');
        return false;
      }
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consent) {
      showToast('กรุณากดติ๊กยอมรับการรับรองข้อมูลก่อนส่งใบสมัคร', 'warning');
      return;
    }
    submitApplication(formData, files);
  };

  const selectedScholarship = scholarships.find(s => s.id === formData.scholarshipId);

  return (
    <div className="modal-backdrop open">
      <div className="modal-card" style={{ maxWidth: 780 }}>
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.25rem' }}>ใบสมัครขอรับทุนการศึกษาออนไลน์</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มจพ.
            </p>
          </div>
          <button className="modal-close-btn" onClick={closeApplicationModal}>&times;</button>
        </div>

        <div className="modal-body">
          {/* Wizard Steps Indicator */}
          <div className="wizard-steps-indicator">
            {[
              { num: 1, label: 'ข้อมูลการศึกษา' },
              { num: 2, label: 'ครอบครัว & รายได้' },
              { num: 3, label: 'กิจกรรม' },
              { num: 4, label: 'เหตุผล' },
              { num: 5, label: 'ยืนยันการสมัคร' }
            ].map(s => {
              let cls = '';
              if (s.num < step) cls = 'done';
              if (s.num === step) cls = 'active';

              return (
                <div key={s.num} className={`wizard-step-item ${cls}`}>
                  <div className="wizard-num">{s.num < step ? '✓' : s.num}</div>
                  <span className="wizard-label">{s.label}</span>
                </div>
              );
            })}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Academic & Personal Info */}
            {step === 1 && (
              <div className="wizard-step-pane">
                <h4 style={{ marginBottom: 16, fontSize: '1.1rem', color: 'var(--kmutnb-orange)' }}>
                  ขั้นตอนที่ 1: ข้อมูลนักศึกษาและการเลือกทุน
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group full-width">
                    <label>เลือกประเภททุนการศึกษาที่ประสงค์จะสมัคร (ถ้ามี)</label>
                    <select 
                      className="form-input-light" 
                      value={formData.scholarshipId}
                      onChange={(e) => setFormData({ ...formData, scholarshipId: e.target.value })}
                    >
                      <option value="">(ไม่ระบุ / ขอรับการพิจารณาทุนทั่วไป)</option>
                      {scholarships.map(s => (
                        <option key={s.id} value={s.id}>{s.title} ({s.amount})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>ชื่อ-นามสกุล (พร้อมคำนำหน้า) *</label>
                    <input 
                      type="text" 
                      className="form-input-light" 
                      placeholder="เช่น นายสมคิด มุ่งมั่นวิทยา" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>ชื่อเล่น</label>
                    <input 
                      type="text" 
                      className="form-input-light" 
                      placeholder="เช่น คิด" 
                      value={formData.nickname}
                      onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>รหัสนักศึกษา (13 หลัก) *</label>
                    <input 
                      type="text" 
                      className="form-input-light" 
                      placeholder="เช่น 6604062610099" 
                      maxLength={13} 
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>สาขาวิชา *</label>
                    <select 
                      className="form-input-light" 
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                      required
                    >
                      <option value="MA โครงการปกติ">MA โครงการปกติ</option>
                      <option value="MA โครงการสมทบ">MA โครงการสมทบ</option>
                      <option value="MC โครงการปกติ">MC โครงการปกติ</option>
                      <option value="MC โครงการสมทบ">MC โครงการสมทบ</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>ระดับชั้นปี *</label>
                    <select 
                      className="form-input-light" 
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      required
                    >
                      <option value="ปี 1">ชั้นปีที่ 1</option>
                      <option value="ปี 2">ชั้นปีที่ 2</option>
                      <option value="ปี 3">ชั้นปีที่ 3</option>
                      <option value="ปี 4">ชั้นปีที่ 4</option>
                      <option value="บัณฑิตศึกษา">บัณฑิตศึกษา</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>เกรดเฉลี่ยสะสม (GPAX) *</label>
                    <input 
                      type="number" 
                      className="form-input-light" 
                      step="0.01" 
                      min="0" 
                      max="4.00" 
                      value={formData.gpax}
                      onChange={(e) => setFormData({ ...formData, gpax: parseFloat(e.target.value) || 0 })}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>เบอร์โทรศัพท์ติดต่อ *</label>
                    <input 
                      type="tel" 
                      className="form-input-light" 
                      placeholder="เช่น 089-123-4567" 
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      required 
                    />
                  </div>

                  <div className="form-group">
                    <label>อีเมลมหาวิทยาลัย (@kmutnb.ac.th) *</label>
                    <input 
                      type="email" 
                      className="form-input-light" 
                      placeholder="s6604062610099@kmutnb.ac.th" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required 
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>ที่อยู่ปัจจุบัน *</label>
                    <textarea 
                      className="form-input-light" 
                      rows={2}
                      placeholder="บ้านเลขที่ หมู่ ซอย ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" 
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required 
                    />
                    <div style={{ display: 'flex', gap: 16, marginTop: 8, alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0, fontWeight: 400 }}>
                        <input 
                          type="checkbox" 
                          checked={formData.isIdCardAddress}
                          onChange={(e) => setFormData({ ...formData, isIdCardAddress: e.target.checked })}
                        />
                        เหมือนที่อยู่ตามบัตรประชาชน
                      </label>
                      {!formData.isIdCardAddress && (
                        <input 
                          type="text" 
                          className="form-input-light" 
                          placeholder="ที่อยู่ตามบัตรประชาชน อยู่จังหวัด..." 
                          style={{ flex: 1 }}
                          value={formData.idCardProvince}
                          onChange={(e) => setFormData({ ...formData, idCardProvince: e.target.value })}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Family & Financial Info */}
            {step === 2 && (
              <div className="wizard-step-pane">
                <h4 style={{ marginBottom: 16, fontSize: '1.1rem', color: 'var(--kmutnb-orange)' }}>
                  ขั้นตอนที่ 2: ข้อมูลครอบครัวและการกู้ยืม
                </h4>
                
                <h5 style={{ margin: '16px 0 8px', color: 'var(--navy-800)' }}>ข้อมูลบิดา</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>ชื่อ-นามสกุล บิดา</label>
                    <input type="text" className="form-input-light" value={formData.fatherName} onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>เบอร์โทรศัพท์บิดา</label>
                    <input type="text" className="form-input-light" value={formData.fatherPhone} onChange={(e) => setFormData({ ...formData, fatherPhone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>อาชีพบิดา</label>
                    <input type="text" className="form-input-light" value={formData.fatherJob} onChange={(e) => setFormData({ ...formData, fatherJob: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>รายได้ต่อเดือน (บาท)</label>
                    <input type="number" className="form-input-light" value={formData.fatherIncome || ''} onChange={(e) => setFormData({ ...formData, fatherIncome: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group full-width" style={{ display: 'flex', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0, fontWeight: 400 }}>
                      <input type="radio" name="fatherAlive" checked={formData.fatherAlive === 'alive'} onChange={() => setFormData({ ...formData, fatherAlive: 'alive' })} /> ยังมีชีวิต
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0, fontWeight: 400 }}>
                      <input type="radio" name="fatherAlive" checked={formData.fatherAlive === 'deceased'} onChange={() => setFormData({ ...formData, fatherAlive: 'deceased' })} /> ถึงแก่กรรม
                    </label>
                  </div>
                </div>

                <h5 style={{ margin: '16px 0 8px', color: 'var(--navy-800)' }}>ข้อมูลมารดา</h5>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>ชื่อ-นามสกุล มารดา</label>
                    <input type="text" className="form-input-light" value={formData.motherName} onChange={(e) => setFormData({ ...formData, motherName: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>เบอร์โทรศัพท์มารดา</label>
                    <input type="text" className="form-input-light" value={formData.motherPhone} onChange={(e) => setFormData({ ...formData, motherPhone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>อาชีพมารดา</label>
                    <input type="text" className="form-input-light" value={formData.motherJob} onChange={(e) => setFormData({ ...formData, motherJob: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>รายได้ต่อเดือน (บาท)</label>
                    <input type="number" className="form-input-light" value={formData.motherIncome || ''} onChange={(e) => setFormData({ ...formData, motherIncome: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="form-group full-width" style={{ display: 'flex', gap: 16 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0, fontWeight: 400 }}>
                      <input type="radio" name="motherAlive" checked={formData.motherAlive === 'alive'} onChange={() => setFormData({ ...formData, motherAlive: 'alive' })} /> ยังมีชีวิต
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', margin: 0, fontWeight: 400 }}>
                      <input type="radio" name="motherAlive" checked={formData.motherAlive === 'deceased'} onChange={() => setFormData({ ...formData, motherAlive: 'deceased' })} /> ถึงแก่กรรม
                    </label>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: 16 }}>
                  <div className="form-group">
                    <label>ความสัมพันธ์ของครอบครัว (ปัจจุบันบิดามารดา)</label>
                    <div style={{ display: 'flex', gap: 16 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 400 }}>
                        <input type="radio" name="relation" checked={formData.parentsRelation === 'together'} onChange={() => setFormData({ ...formData, parentsRelation: 'together' })} /> อยู่ด้วยกัน
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 400 }}>
                        <input type="radio" name="relation" checked={formData.parentsRelation === 'divorced'} onChange={() => setFormData({ ...formData, parentsRelation: 'divorced' })} /> หย่าร้าง
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 400 }}>
                        <input type="radio" name="relation" checked={formData.parentsRelation === 'other'} onChange={() => setFormData({ ...formData, parentsRelation: 'other' })} /> อื่นๆ
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>ผู้รับผิดชอบค่าใช้จ่ายในการศึกษา (เลือกได้มากกว่า 1)</label>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 400 }}>
                        <input type="checkbox" checked={formData.sponsor.includes('father')} onChange={(e) => {
                          const sponsor = e.target.checked ? [...formData.sponsor, 'father'] : formData.sponsor.filter(s => s !== 'father');
                          setFormData({ ...formData, sponsor });
                        }} /> บิดา
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 400 }}>
                        <input type="checkbox" checked={formData.sponsor.includes('mother')} onChange={(e) => {
                          const sponsor = e.target.checked ? [...formData.sponsor, 'mother'] : formData.sponsor.filter(s => s !== 'mother');
                          setFormData({ ...formData, sponsor });
                        }} /> มารดา
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 400 }}>
                        <input type="checkbox" checked={formData.sponsor.includes('other')} onChange={(e) => {
                          const sponsor = e.target.checked ? [...formData.sponsor, 'other'] : formData.sponsor.filter(s => s !== 'other');
                          setFormData({ ...formData, sponsor });
                        }} /> อื่นๆ ระบุ
                      </label>
                      {formData.sponsor.includes('other') && (
                        <input type="text" className="form-input-light" style={{ flex: 1, padding: '4px 8px' }} placeholder="เช่น ญาติ พี่สาว กองทุน" value={formData.sponsorOther} onChange={(e) => setFormData({...formData, sponsorOther: e.target.value})} />
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>ข้อมูลการกู้ยืมจากกองทุนการศึกษา</label>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 400 }}>
                        <input type="radio" name="loanStatus" checked={formData.loanStatus === 'none'} onChange={() => setFormData({ ...formData, loanStatus: 'none', loanAmount: 0 })} /> ไม่กู้
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 400 }}>
                        <input type="radio" name="loanStatus" checked={formData.loanStatus === 'กยศ'} onChange={() => setFormData({ ...formData, loanStatus: 'กยศ' })} /> กู้ กยศ.
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 400 }}>
                        <input type="radio" name="loanStatus" checked={formData.loanStatus === 'กรอ'} onChange={() => setFormData({ ...formData, loanStatus: 'กรอ' })} /> กู้ กรอ.
                      </label>
                      {formData.loanStatus !== 'none' && (
                        <input type="number" className="form-input-light" style={{ width: 150 }} placeholder="บาท / ปี" value={formData.loanAmount || ''} onChange={(e) => setFormData({...formData, loanAmount: parseFloat(e.target.value) || 0})} />
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>ข้อมูลการทำงานพิเศษของนักศึกษา</label>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 400 }}>
                        <input type="radio" checked={!formData.hasPartTimeJob} onChange={() => setFormData({ ...formData, hasPartTimeJob: false, partTimeJobLocation: '', partTimeJobIncome: 0 })} /> ไม่ทำงานพิเศษ
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 400 }}>
                        <input type="radio" checked={formData.hasPartTimeJob} onChange={() => setFormData({ ...formData, hasPartTimeJob: true })} /> ทำงานพิเศษ
                      </label>
                    </div>
                    {formData.hasPartTimeJob && (
                      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <input type="text" className="form-input-light" placeholder="สถานที่ทำงาน" style={{ flex: 2 }} value={formData.partTimeJobLocation} onChange={(e) => setFormData({...formData, partTimeJobLocation: e.target.value})} />
                        <input type="number" className="form-input-light" placeholder="รายได้ (บาท/เดือน)" style={{ flex: 1 }} value={formData.partTimeJobIncome || ''} onChange={(e) => setFormData({...formData, partTimeJobIncome: parseFloat(e.target.value) || 0})} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Activities */}
            {step === 3 && (
              <div className="wizard-step-pane">
                <h4 style={{ marginBottom: 16, fontSize: '1.1rem', color: 'var(--kmutnb-orange)' }}>
                  ขั้นตอนที่ 3: ข้อมูลกิจกรรม
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                  <div className="form-group">
                    <label>ประสบการณ์/กิจกรรมเพื่อสังคมส่วนรวม หรือกิจกรรมของภาควิชา</label>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 400 }}>
                        <input type="radio" checked={!formData.hasActivities} onChange={() => setFormData({ ...formData, hasActivities: false, activities: '', activityRole: '' })} /> ไม่มี
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontWeight: 400 }}>
                        <input type="radio" checked={formData.hasActivities} onChange={() => setFormData({ ...formData, hasActivities: true })} /> มี (ระบุ)
                      </label>
                    </div>
                    {formData.hasActivities && (
                      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <input type="text" className="form-input-light" placeholder="ชื่อกิจกรรม" style={{ flex: 2 }} value={formData.activities} onChange={(e) => setFormData({...formData, activities: e.target.value})} />
                        <input type="text" className="form-input-light" placeholder="หน้าที่/รับผิดชอบ" style={{ flex: 1 }} value={formData.activityRole} onChange={(e) => setFormData({...formData, activityRole: e.target.value})} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Statement of Need */}
            {step === 4 && (
              <div className="wizard-step-pane">
                <h4 style={{ marginBottom: 16, fontSize: '1.1rem', color: 'var(--kmutnb-orange)' }}>
                  ขั้นตอนที่ 4: เหตุผลและความจำเป็น
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label>เรียงความแสดงเหตุผลและความจำเป็นในการขอรับทุนการศึกษา (Statement of Need) *</label>
                    <textarea 
                      className="form-input-light" 
                      rows={8} 
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="อธิบายถึงความจำเป็นที่ต้องขอรับทุนการศึกษา..."
                      required 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Review & Confirmation */}
            {step === 5 && (
              <div className="wizard-step-pane">
                <h4 style={{ marginBottom: 16, fontSize: '1.1rem', color: 'var(--kmutnb-orange)' }}>
                  ขั้นตอนที่ 5: ตรวจสอบข้อมูลและยืนยันการสมัคร
                </h4>
                <div className="application-detail-card">
                  <div className="detail-row-grid">
                    <div>
                      <span className="detail-item-label">ทุนการศึกษาที่สมัคร</span>
                      <span className="detail-item-value" style={{ color: 'var(--kmutnb-orange)' }}>
                        {selectedScholarship?.title || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="detail-item-label">รหัสนักศึกษา / ชื่อนามสกุล</span>
                      <span className="detail-item-value">{formData.studentId} ({formData.fullName})</span>
                    </div>
                    <div>
                      <span className="detail-item-label">สาขาวิชา / ชั้นปี</span>
                      <span className="detail-item-value">{formData.major} ({formData.year})</span>
                    </div>
                    <div>
                      <span className="detail-item-label">เกรดเฉลี่ยสะสม (GPAX)</span>
                      <span className="detail-item-value">{formData.gpax.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="detail-item-label">รายได้ครอบครัวต่อปี</span>
                      <span className="detail-item-value">{formData.familyIncome.toLocaleString()} บาท</span>
                    </div>
                    <div>
                      <span className="detail-item-label">เอกสารประกอบที่แนบ</span>
                      <span className="detail-item-value" style={{ color: 'var(--success)' }}>
                        {Object.values(files).filter(Boolean).length} รายการ (ครบถ้วน)
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="detail-item-label">เหตุผลความจำเป็น</span>
                    <p style={{ fontSize: '0.88rem', color: 'var(--navy-800)', marginTop: 4, background: 'var(--surface-alt)', padding: 10, borderRadius: 'var(--radius-sm)' }}>
                      {formData.reason}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <input 
                    type="checkbox" 
                    id="consentCheck"
                    style={{ marginTop: 5 }} 
                    checked={formData.consent}
                    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                    required 
                  />
                  <label htmlFor="consentCheck" style={{ fontSize: '0.88rem', color: 'var(--navy-800)' }}>
                    ข้าพเจ้าขอรับรองว่าข้อความและเอกสารที่ระบุในใบสมัครนี้เป็นความจริงทุกประการ หากตรวจสอบพบข้อความอันเป็นเท็จ ข้าพเจ้ายินยอมให้ตัดสิทธิ์การรับทุนทันที
                  </label>
                </div>
              </div>
            )}

            <div className="modal-footer" style={{ marginTop: 24 }}>
              {step > 1 && (
                <button type="button" className="btn btn-secondary" onClick={handlePrev}>
                  ย้อนกลับ
                </button>
              )}
              {step < 5 ? (
                <button type="button" className="btn btn-primary" onClick={handleNext}>
                  ขั้นตอนถัดไป &rarr;
                </button>
              ) : (
                <button type="submit" className="btn btn-primary">
                  ยืนยันส่งใบสมัคร
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
