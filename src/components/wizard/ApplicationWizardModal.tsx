import React, { useState, useEffect } from 'react';
import { useScholarship } from '../../context/ScholarshipContext';
import { ApplicationFormData, UploadedFiles, Address } from '../../types/application';
import { PROVINCES } from '../../data/provinces';

const INITIAL_FORM: ApplicationFormData = {
  scholarshipId: '',
  studentId: '6604062610099',
  firstName: 'นายสมคิด',
  lastName: 'มุ่งมั่นวิทยา',
  fullName: 'นายสมคิด มุ่งมั่นวิทยา',
  nickname: 'คิด',
  major: 'MA โครงการปกติ',
  year: 'ปี 2',
  gpax: 3.45,
  phone: '089-123-4567',
  email: 's6604062610099@email.kmutnb.ac.th',
  address: {
    houseNo: '1518',
    moo: '',
    soi: '',
    road: 'ประชาราษฎร์ 1',
    subDistrict: 'วงศ์สว่าง',
    district: 'บางซื่อ',
    province: 'กรุงเทพมหานคร',
    zipCode: '10800'
  },
  isIdCardAddress: true,
  idCardAddress: {
    houseNo: '1518',
    moo: '',
    soi: '',
    road: 'ประชาราษฎร์ 1',
    subDistrict: 'วงศ์สว่าง',
    district: 'บางซื่อ',
    province: 'กรุงเทพมหานคร',
    zipCode: '10800'
  },

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
  activityList: [
    { name: 'ค่ายคณิตศาสตร์สัญจร มจพ.', role: 'สวัสดิการ', photoBase64: null }
  ],
  volunteerHours: 35,

  reason: 'ครอบครัวมีภาระค่าใช้จ่ายสูง\nมีพี่น้องกำลังศึกษาอยู่ 2 คน\nต้องการนำเงินมาแบ่งเบาภาระค่าใช้จ่ายในการครองชีพ และค่าอุปกรณ์การเรียน',
  reasonsList: [
    'ครอบครัวมีภาระค่าใช้จ่ายสูง',
    'มีพี่น้องกำลังศึกษาอยู่ 2 คน',
    'ต้องการนำเงินมาแบ่งเบาภาระค่าใช้จ่ายในการครองชีพ และค่าอุปกรณ์การเรียน'
  ],
  consent: false,
  systemRating: 0,
  systemComment: ''
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
  const [isRatingModalOpen, setIsRatingModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<ApplicationFormData>(INITIAL_FORM);
  const [hasSiblings, setHasSiblings] = useState<boolean>(Number(INITIAL_FORM.siblings) > 0);
  const [files, setFiles] = useState<UploadedFiles>({
    doc1: null,
    doc2: null,
    doc3: null,
    profilePhoto: null
  });

  useEffect(() => {
    if (isWizardModalOpen) {
      setStep(1);
      setIsRatingModalOpen(false);
      setHasSiblings(Number(INITIAL_FORM.siblings) > 0);
      if (selectedScholarshipIdForApply) {
        setFormData(prev => ({ ...prev, scholarshipId: selectedScholarshipIdForApply }));
      } else if (scholarships.length > 0) {
        setFormData(prev => ({ ...prev, scholarshipId: scholarships[0].id }));
      }
    }
  }, [isWizardModalOpen, selectedScholarshipIdForApply, scholarships]);

  if (!isWizardModalOpen) return null;

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.studentId || formData.studentId.length < 8) {
        showToast('กรุณากรอกรหัสนักศึกษาให้ถูกต้อง', 'warning');
        return false;
      }
      const gpaxNum = Number(formData.gpax);
      if (isNaN(gpaxNum) || gpaxNum < 0 || gpaxNum > 4) {
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

      const reqIdCard = formData.idCardAddress;
      if (!reqIdCard.houseNo.trim() || !reqIdCard.subDistrict.trim() || !reqIdCard.district.trim() || !reqIdCard.province.trim() || !reqIdCard.zipCode.trim()) {
        showToast('กรุณากรอกข้อมูลที่อยู่ตามบัตรประชาชนให้ครบถ้วน', 'warning');
        return false;
      }

      const reqAddr = formData.address;
      if (!formData.isIdCardAddress && (!reqAddr.houseNo.trim() || !reqAddr.subDistrict.trim() || !reqAddr.district.trim() || !reqAddr.province.trim() || !reqAddr.zipCode.trim())) {
        showToast('กรุณากรอกข้อมูลที่อยู่ปัจจุบันให้ครบถ้วน', 'warning');
        return false;
      }
    }

    if (currentStep === 2) {
      if (formData.sponsor.length === 0) {
        showToast('กรุณาเลือกผู้รับผิดชอบค่าใช้จ่ายในการศึกษาอย่างน้อย 1 ข้อ', 'warning');
        return false;
      }
      if (hasSiblings && (!formData.siblings || Number(formData.siblings) <= 0)) {
        showToast('กรุณาระบุจำนวนพี่น้องให้ถูกต้อง', 'warning');
        return false;
      }
      if (formData.hasPartTimeJob && !formData.partTimeJobLocation.trim()) {
        showToast('กรุณาระบุอาชีพงานพิเศษ', 'warning');
        return false;
      }
    }

    if (currentStep === 3) {
      if (formData.hasActivities) {
        const hasAnyActivity = formData.activityList?.some(a => a.name.trim() !== '');
        if (!hasAnyActivity) {
          showToast('กรุณาระบุชื่อกิจกรรมอย่างน้อย 1 กิจกรรม หรือเลือกไม่มีกิจกรรม', 'warning');
          return false;
        }
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
    
    // Open rating modal instead of direct submit
    setIsRatingModalOpen(true);
  };

  const handleNumberChange = (field: keyof ApplicationFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNumberBlur = (field: keyof ApplicationFormData, defaultValue: number = 0) => {
    setFormData(prev => {
      const current = prev[field];
      if (current === '' || current === undefined || current === null || isNaN(Number(current))) {
        return { ...prev, [field]: defaultValue };
      }
      return { ...prev, [field]: Number(current) };
    });
  };

  const handleFinalSubmit = () => {
    if (formData.systemRating === 0) {
      showToast('กรุณาให้คะแนนความพึงพอใจการใช้งานก่อนส่งใบสมัคร', 'warning');
      return;
    }
    setIsRatingModalOpen(false);
    const sanitizedData: ApplicationFormData = {
      ...formData,
      gpax: Number(formData.gpax) || 0,
      fatherIncome: Number(formData.fatherIncome) || 0,
      motherIncome: Number(formData.motherIncome) || 0,
      familyIncome: Number(formData.familyIncome) || 0,
      siblings: Number(formData.siblings) || 0,
      loanAmount: Number(formData.loanAmount) || 0,
      partTimeJobIncome: Number(formData.partTimeJobIncome) || 0,
    };
    submitApplication(sanitizedData, files);
  };

  const selectedScholarship = scholarships.find(s => s.id === formData.scholarshipId);
  const currentScope = selectedScholarship?.scope 
    || scholarships.find(s => s.id === selectedScholarshipIdForApply)?.scope;

  const availableScholarships = currentScope
    ? scholarships.filter(s => s.scope === currentScope)
    : scholarships;

  const renderAddressGrid = (fieldPrefix: 'idCardAddress' | 'address') => {
    const addr = formData[fieldPrefix];

    const updateAddr = (key: keyof Address, val: string) => {
      const newAddr = { ...addr, [key]: val };
      if (fieldPrefix === 'idCardAddress') {
        setFormData({
          ...formData,
          idCardAddress: newAddr,
          ...(formData.isIdCardAddress ? { address: newAddr } : {})
        });
      } else {
        setFormData({ ...formData, address: newAddr });
      }
    };

    return (
      <div className="address-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        <div className="form-group-sm">
          <label className="sub-label">บ้านเลขที่ *</label>
          <input type="text" className="form-input-light" placeholder="ระบุบ้านเลขที่" value={addr.houseNo} onChange={e => updateAddr('houseNo', e.target.value)} required />
        </div>
        <div className="form-group-sm">
          <label className="sub-label">หมู่</label>
          <input type="text" className="form-input-light" placeholder="เช่น 1 (ถ้ามี)" value={addr.moo} onChange={e => updateAddr('moo', e.target.value)} />
        </div>
        <div className="form-group-sm">
          <label className="sub-label">ซอย</label>
          <input type="text" className="form-input-light" placeholder="ระบุซอย (ถ้ามี)" value={addr.soi} onChange={e => updateAddr('soi', e.target.value)} />
        </div>
        <div className="form-group-sm">
          <label className="sub-label">ถนน</label>
          <input type="text" className="form-input-light" placeholder="ระบุถนน (ถ้ามี)" value={addr.road} onChange={e => updateAddr('road', e.target.value)} />
        </div>
        <div className="form-group-sm">
          <label className="sub-label">ตำบล/แขวง *</label>
          <input type="text" className="form-input-light" placeholder="ตำบล หรือ แขวง" value={addr.subDistrict} onChange={e => updateAddr('subDistrict', e.target.value)} required />
        </div>
        <div className="form-group-sm">
          <label className="sub-label">อำเภอ/เขต *</label>
          <input type="text" className="form-input-light" placeholder="อำเภอ หรือ เขต" value={addr.district} onChange={e => updateAddr('district', e.target.value)} required />
        </div>
        <div className="form-group-sm">
          <label className="sub-label">จังหวัด *</label>
          <select className="form-input-light" value={addr.province} onChange={e => updateAddr('province', e.target.value)} required>
            <option value="" disabled>เลือกจังหวัด</option>
            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group-sm">
          <label className="sub-label">รหัสไปรษณีย์ *</label>
          <input type="text" className="form-input-light" placeholder="เช่น 10800" value={addr.zipCode} onChange={e => updateAddr('zipCode', e.target.value)} required />
        </div>
      </div>
    );
  };

  return (
    <div
      className="modal-backdrop open"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflowY: 'auto'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeApplicationModal();
        }
      }}
    >
      <div
        className="modal-card"
        style={{
          width: '100%',
          maxWidth: '740px',
          maxHeight: '90vh',
          background: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          border: '1px solid rgba(226, 232, 240, 0.9)'
        }}
      >
        <div style={{
          padding: '18px 24px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          flexShrink: 0
        }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '5px', height: '100%', background: '#1F4F2C' }}></div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: '0 0 2px', letterSpacing: '-0.01em' }}>
              ใบสมัครขอรับทุนการศึกษา
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem' }}>
              กรอกข้อมูลให้ครบถ้วนเพื่อยืนยันการสมัคร
            </p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={closeApplicationModal}
            aria-label="Close"
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              fontSize: '18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              transition: 'background 0.2s, color 0.2s'
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {step === 1 && (
            <div className="wizard-step-pane">
              <h4 className="wizard-step-title">
                <span className="wizard-step-badge">1</span>
                ข้อมูลนักศึกษาและการเลือกทุน
              </h4>

              <div className="wizard-hero-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                <div className="wizard-photo-upload" style={{ width: '150px' }}>
                  <label className="wizard-photo-label" style={{ display: 'block', cursor: 'pointer' }}>
                    {files.profilePhoto ? (
                      <>
                        <img src={files.profilePhoto} alt="Profile Preview" className="wizard-photo-img" style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '16px' }} />
                        <div className="wizard-photo-overlay" style={{ textAlign: 'center', marginTop: 6, color: '#0f172a', fontSize: '0.8rem' }}>เปลี่ยนรูป</div>
                      </>
                    ) : (
                      <div className="wizard-photo-placeholder" style={{ width: '100%', height: '150px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1', borderRadius: '16px', background: '#f8fafc', color: '#475569' }}>
                        <svg
                          width="48"
                          height="48"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#94a3b8"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeDasharray="3 3"
                          style={{ marginBottom: '6px' }}
                        >
                          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 500 }}>คลิกเพื่อเลือกรูป</span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFiles(prev => ({ ...prev, profilePhoto: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        } else {
                          setFiles(prev => ({ ...prev, profilePhoto: null }));
                        }
                      }}
                    />
                  </label>
                  <span className="wizard-photo-caption" style={{ display: 'block', textAlign: 'center', marginTop: 10, color: '#64748b', fontSize: '0.82rem' }}>รูปถ่ายปัจจุบัน (หน้าตรง)</span>
                </div>

                <div className="wizard-hero-fields" style={{ width: '100%' }}>
                  <div className="form-group" style={{ marginBottom: '16px' }}>
                    <label>
                      เลือกประเภททุนการศึกษาที่ประสงค์จะสมัคร {currentScope === 'external' ? '(ทุนภายนอก)' : currentScope === 'internal' ? '(ทุนภายใน)' : ''} *
                    </label>
                    <select
                      className="form-input-light"
                      value={formData.scholarshipId}
                      onChange={(e) => setFormData({ ...formData, scholarshipId: e.target.value })}
                    >
                      {availableScholarships.map(s => (
                        <option key={s.id} value={s.id}>{s.title} ({s.amount})</option>
                      ))}
                    </select>
                  </div>

                  <div className="wizard-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
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
                      <label>ชื่อ (พร้อมคำนำหน้า)</label>
                      <input
                        type="text"
                        className="form-input-light"
                        placeholder="เช่น นายสมคิด"
                        value={formData.firstName || ''}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value, fullName: `${e.target.value} ${formData.lastName || ''}`.trim() })}
                      />
                    </div>

                    <div className="form-group">
                      <label>นามสกุล</label>
                      <input
                        type="text"
                        className="form-input-light"
                        placeholder="เช่น มุ่งมั่นวิทยา"
                        value={formData.lastName || ''}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value, fullName: `${formData.firstName || ''} ${e.target.value}`.trim() })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="wizard-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '24px' }}>
                <div className="form-group">
                  <label>เบอร์โทรศัพท์ติดต่อ *</label>
                  <input type="tel" className="form-input-light" placeholder="เช่น 089-123-4567" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>อีเมลมหาวิทยาลัย (@email.kmutnb.ac.th) *</label>
                  <input type="email" className="form-input-light" placeholder="s6604062610099@email.kmutnb.ac.th" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>สาขาวิชา *</label>
                  <select className="form-input-light" value={formData.major} onChange={(e) => setFormData({ ...formData, major: e.target.value })} required>
                    <option value="MA โครงการปกติ">MA โครงการปกติ</option>
                    <option value="MA โครงการสมทบ">MA โครงการสมทบ</option>
                    <option value="MC โครงการปกติ">MC โครงการปกติ</option>
                    <option value="MC โครงการสมทบ">MC โครงการสมทบ</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>ระดับชั้นปี *</label>
                  <select className="form-input-light" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} required>
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
                    placeholder="0.00"
                    value={formData.gpax}
                    onChange={(e) => handleNumberChange('gpax', e.target.value)}
                    onBlur={() => handleNumberBlur('gpax', 0)}
                    required
                  />
                </div>
              </div>

              <div className="form-group full-width" style={{ marginTop: '24px' }}>
                <label>ที่อยู่ตามบัตรประชาชน *</label>
                {renderAddressGrid('idCardAddress')}
                <label className="wizard-checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, color: '#334155' }}>
                  <input
                    type="checkbox"
                    checked={formData.isIdCardAddress}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      setFormData({
                        ...formData,
                        isIdCardAddress: isChecked,
                        address: isChecked ? { ...formData.idCardAddress } : { ...formData.address }
                      });
                    }}
                  />
                  ที่อยู่ปัจจุบันตรงกับที่อยู่ตามบัตรประชาชน
                </label>
              </div>

              {!formData.isIdCardAddress && (
                <div className="form-group full-width" style={{ marginTop: '20px' }}>
                  <label>ที่อยู่ปัจจุบัน *</label>
                  {renderAddressGrid('address')}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step-pane">
              <h4 className="wizard-step-title">
                <span className="wizard-step-badge">2</span>
                ข้อมูลครอบครัวและการกู้ยืม
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ background: '#ffffff', border: '1px solid rgba(148,163,184,0.28)', borderRadius: 18, padding: '18px 18px 12px', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.04)' }}>
                  <h5 className="wizard-section-title" style={{ margin: 0, marginBottom: 14 }}>👨 ข้อมูลบิดา</h5>
                  <div className="wizard-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
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
                      <input
                        type="number"
                        className="form-input-light"
                        placeholder="0"
                        value={formData.fatherIncome}
                        onChange={(e) => handleNumberChange('fatherIncome', e.target.value)}
                        onBlur={() => handleNumberBlur('fatherIncome', 0)}
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>สถานภาพบิดา</label>
                      <select className="form-input-light" value={formData.fatherAlive} onChange={(e) => setFormData({ ...formData, fatherAlive: e.target.value as 'alive' | 'deceased' })}>
                        <option value="alive">ยังมีชีวิต</option>
                        <option value="deceased">ถึงแก่กรรม</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid rgba(148,163,184,0.28)', borderRadius: 18, padding: '18px 18px 12px', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.04)' }}>
                  <h5 className="wizard-section-title" style={{ margin: 0, marginBottom: 14 }}>👩 ข้อมูลมารดา</h5>
                  <div className="wizard-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
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
                      <input
                        type="number"
                        className="form-input-light"
                        placeholder="0"
                        value={formData.motherIncome}
                        onChange={(e) => handleNumberChange('motherIncome', e.target.value)}
                        onBlur={() => handleNumberBlur('motherIncome', 0)}
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>สถานภาพมารดา</label>
                      <select className="form-input-light" value={formData.motherAlive} onChange={(e) => setFormData({ ...formData, motherAlive: e.target.value as 'alive' | 'deceased' })}>
                        <option value="alive">ยังมีชีวิต</option>
                        <option value="deceased">ถึงแก่กรรม</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#ffffff', border: '1px solid rgba(148,163,184,0.22)', borderRadius: 18, padding: '18px 18px 12px', boxShadow: '0 8px 18px rgba(15, 23, 42, 0.03)' }}>
                  <h5 className="wizard-section-title" style={{ margin: 0, marginBottom: 14, background: 'transparent', borderLeft: 'none', padding: '0 0 10px', borderBottom: '1px solid rgba(148,163,184,0.22)' }}>💰 ข้อมูลทางการเงิน</h5>
                  <div className="wizard-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                    <div className="form-group">
                      <label>ความสัมพันธ์ของครอบครัว</label>
                      <select className="form-input-light" value={formData.parentsRelation} onChange={(e) => setFormData({ ...formData, parentsRelation: e.target.value as 'together' | 'divorced' | 'other' })}>
                        <option value="together">อยู่ด้วยกัน</option>
                        <option value="divorced">หย่าร้าง</option>
                        <option value="other">อื่นๆ</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>รายได้ครอบครัวต่อปี (บาท)</label>
                      <input
                        type="number"
                        className="form-input-light"
                        placeholder="0"
                        value={formData.familyIncome}
                        onChange={(e) => handleNumberChange('familyIncome', e.target.value)}
                        onBlur={() => handleNumberBlur('familyIncome', 0)}
                      />
                    </div>
                    <div className="form-group">
                      <label>พี่น้อง</label>
                      <select
                        className="form-input-light"
                        value={hasSiblings ? 'yes' : 'no'}
                        onChange={(e) => {
                          const has = e.target.value === 'yes';
                          setHasSiblings(has);
                          setFormData({ ...formData, siblings: has ? (Number(formData.siblings) > 0 ? formData.siblings : 1) : 0 });
                        }}
                      >
                        <option value="no">ไม่มี</option>
                        <option value="yes">มี</option>
                      </select>
                    </div>
                    {hasSiblings && (
                      <div className="form-group">
                        <label>จำนวนพี่น้อง (คน) *</label>
                        <input
                          type="number"
                          min="1"
                          className="form-input-light"
                          placeholder="ระบุจำนวนพี่น้อง เช่น 1"
                          value={formData.siblings}
                          onChange={(e) => handleNumberChange('siblings', e.target.value)}
                          onBlur={() => handleNumberBlur('siblings', 1)}
                          required
                        />
                      </div>
                    )}
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>ผู้รับผิดชอบค่าใช้จ่ายในการศึกษา</label>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', padding: '12px 14px', border: '1px solid rgba(148,163,184,0.35)', borderRadius: 14, background: 'rgba(255,255,255,0.75)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minWidth: 92 }}>
                          <input type="checkbox" checked={formData.sponsor.includes('father')} onChange={(e) => {
                            const sponsor = e.target.checked ? [...formData.sponsor, 'father'] : formData.sponsor.filter(s => s !== 'father');
                            setFormData({ ...formData, sponsor });
                          }} /> บิดา
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minWidth: 92 }}>
                          <input type="checkbox" checked={formData.sponsor.includes('mother')} onChange={(e) => {
                            const sponsor = e.target.checked ? [...formData.sponsor, 'mother'] : formData.sponsor.filter(s => s !== 'mother');
                            setFormData({ ...formData, sponsor });
                          }} /> มารดา
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', minWidth: 100 }}>
                          <input type="checkbox" checked={formData.sponsor.includes('other')} onChange={(e) => {
                            const sponsor = e.target.checked ? [...formData.sponsor, 'other'] : formData.sponsor.filter(s => s !== 'other');
                            setFormData({ ...formData, sponsor });
                          }} /> อื่นๆ ระบุ
                        </label>
                        {formData.sponsor.includes('other') && (
                          <input type="text" className="form-input-light" style={{ flex: '1 1 220px', minWidth: '180px' }} placeholder="เช่น ญาติ พี่สาว กองทุน" value={formData.sponsorOther} onChange={(e) => setFormData({ ...formData, sponsorOther: e.target.value })} />
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>ข้อมูลการกู้ยืมจากกองทุนการศึกษา</label>
                      <select className="form-input-light" value={formData.loanStatus} onChange={(e) => {
                        const val = e.target.value as 'none' | 'กยศ';
                        setFormData({ ...formData, loanStatus: val, ...(val === 'none' ? { loanAmount: 0 } : {}) });
                      }}>
                        <option value="none">ไม่กู้</option>
                        <option value="กยศ">กู้ กยศ.</option>
                      </select>
                    </div>
                    {formData.loanStatus !== 'none' && (
                      <div className="form-group">
                        <label>จำนวนเงินกู้ (บาท / ปี)</label>
                        <input
                          type="number"
                          className="form-input-light"
                          placeholder="ระบุจำนวนเงิน"
                          value={formData.loanAmount}
                          onChange={(e) => handleNumberChange('loanAmount', e.target.value)}
                          onBlur={() => handleNumberBlur('loanAmount', 0)}
                        />
                      </div>
                    )}
                    <div className="form-group">
                      <label>ข้อมูลการทำงานพิเศษของนักศึกษา</label>
                      <select className="form-input-light" value={formData.hasPartTimeJob ? 'yes' : 'no'} onChange={(e) => {
                        const hasJob = e.target.value === 'yes';
                        setFormData({ ...formData, hasPartTimeJob: hasJob, ...(hasJob ? {} : { partTimeJobLocation: '', partTimeJobIncome: 0 }) });
                      }}>
                        <option value="no">ไม่ทำงานพิเศษ</option>
                        <option value="yes">ทำงานพิเศษ</option>
                      </select>
                    </div>
                    {formData.hasPartTimeJob && (
                      <>
                        <div className="form-group">
                          <label>อาชีพ</label>
                          <input type="text" className="form-input-light" placeholder="เช่น ติวเตอร์, พนักงานพาร์ตไทม์, ค้าขาย" value={formData.partTimeJobLocation} onChange={(e) => setFormData({ ...formData, partTimeJobLocation: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label>รายได้ต่อเดือน (บาท)</label>
                          <input
                            type="number"
                            className="form-input-light"
                            placeholder="ระบุรายได้"
                            value={formData.partTimeJobIncome}
                            onChange={(e) => handleNumberChange('partTimeJobIncome', e.target.value)}
                            onBlur={() => handleNumberBlur('partTimeJobIncome', 0)}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step-pane">
              <h4 className="wizard-step-title">
                <span className="wizard-step-badge">3</span>
                ข้อมูลกิจกรรม
              </h4>

              <div className="form-group">
                <label>ประสบการณ์/กิจกรรมเพื่อสังคมส่วนรวม หรือกิจกรรมของภาควิชา</label>
                <select className="form-input-light" value={formData.hasActivities ? 'yes' : 'no'} onChange={(e) => {
                  const hasAct = e.target.value === 'yes';
                  setFormData({ ...formData, hasActivities: hasAct, ...(hasAct ? {} : { activities: '', activityRole: '' }) });
                }}>
                  <option value="no">ไม่มี</option>
                  <option value="yes">มี (ระบุ)</option>
                </select>

                {formData.hasActivities && (
                  <div style={{ marginTop: 16 }}>
                    {(formData.activityList || []).map((activity, index) => (
                      <div key={index} style={{ background: '#f8fafc', padding: 16, borderRadius: '12px', marginBottom: 16, border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                          <strong style={{ color: '#0f172a' }}>กิจกรรมที่ {index + 1}</strong>
                          <button
                            type="button"
                            onClick={() => {
                              const newList = [...(formData.activityList || [])];
                              newList.splice(index, 1);
                              setFormData({ ...formData, activityList: newList });
                            }}
                            style={{ color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.85rem' }}
                          >
                            ✖ ลบกิจกรรม
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '100px minmax(0, 1fr)', gap: '16px' }}>
                          <label style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '12px', border: '2px dashed #cbd5e1', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            {activity.photoBase64 ? (
                              <>
                                <img src={activity.photoBase64} alt="Activity" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.7rem', padding: '4px', textAlign: 'center' }}>เปลี่ยนรูป</div>
                              </>
                            ) : (
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '20px' }}>📷</div>
                                <div style={{ fontSize: '0.75rem' }}>อัปโหลดรูป</div>
                              </div>
                            )}
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg"
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const newList = [...(formData.activityList || [])];
                                    newList[index] = { ...newList[index], photoBase64: reader.result as string };
                                    setFormData({ ...formData, activityList: newList });
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <input type="text" className="form-input-light" placeholder="ชื่อกิจกรรม" value={activity.name} onChange={(e) => {
                              const newList = [...(formData.activityList || [])];
                              newList[index] = { ...newList[index], name: e.target.value };
                              setFormData({ ...formData, activityList: newList });
                            }} />
                            <input type="text" className="form-input-light" placeholder="หน้าที่/รับผิดชอบ" value={activity.role} onChange={(e) => {
                              const newList = [...(formData.activityList || [])];
                              newList[index] = { ...newList[index], role: e.target.value };
                              setFormData({ ...formData, activityList: newList });
                            }} />
                          </div>
                        </div>
                      </div>
                    ))}

                    {(formData.activityList || []).length < 3 && (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ fontSize: '0.9rem', width: '100%', padding: '12px' }}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            activityList: [...(formData.activityList || []), { name: '', role: '', photoBase64: null }]
                          });
                        }}
                      >
                        + เพิ่มกิจกรรม (สามารถเพิ่มได้อีก {3 - (formData.activityList || []).length} กิจกรรม)
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="wizard-step-pane">
              <h4 className="wizard-step-title">
                <span className="wizard-step-badge">4</span>
                เหตุผลและความจำเป็น
              </h4>

              <div className="form-group">
                <label>เหตุผลและความจำเป็นในการขอรับทุนการศึกษา (ระบุเป็นข้อความสั้นๆ ไม่เกิน 5 ข้อ)</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
                  {(formData.reasonsList || ['']).map((r, index) => (
                    <div key={index} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ color: '#475569', fontWeight: 600, width: 24, textAlign: 'center' }}>{index + 1}.</span>
                      <input
                        type="text"
                        className="form-input-light"
                        value={r}
                        onChange={(e) => {
                          const newList = [...(formData.reasonsList || [''])];
                          newList[index] = e.target.value;
                          setFormData({ ...formData, reasonsList: newList, reason: newList.join('\n') });
                        }}
                        placeholder="เช่น ครอบครัวมีภาระค่าใช้จ่ายสูง"
                      />
                      {(formData.reasonsList || ['']).length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newList = [...(formData.reasonsList || [''])];
                            newList.splice(index, 1);
                            setFormData({ ...formData, reasonsList: newList, reason: newList.join('\n') });
                          }}
                          style={{ color: '#dc2626', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: '0 8px' }}
                        >
                          ✖
                        </button>
                      )}
                    </div>
                  ))}

                  {(formData.reasonsList || ['']).length < 5 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ alignSelf: 'flex-start', marginTop: 8 }}
                      onClick={() => {
                        const newList = [...(formData.reasonsList || ['']), ''];
                        setFormData({ ...formData, reasonsList: newList, reason: newList.join('\n') });
                      }}
                    >
                      + เพิ่มเหตุผล (เพิ่มได้อีก {5 - (formData.reasonsList || ['']).length} ข้อ)
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="wizard-step-pane">
              <h4 className="wizard-step-title">
                <span className="wizard-step-badge">5</span>
                ตรวจสอบข้อมูลและยืนยันการสมัคร
              </h4>

              <div className="application-detail-card" style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
                <div className="detail-row-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div>
                    <span className="detail-item-label">ทุนการศึกษาที่สมัคร</span>
                    <span className="detail-item-value" style={{ color: '#ea580c', display: 'block', marginTop: 4 }}>
                      {selectedScholarship?.title || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="detail-item-label">รหัสนักศึกษา / ชื่อนามสกุล</span>
                    <span className="detail-item-value" style={{ display: 'block', marginTop: 4 }}>{formData.studentId} ({formData.fullName})</span>
                  </div>
                  <div>
                    <span className="detail-item-label">สาขาวิชา / ชั้นปี</span>
                    <span className="detail-item-value" style={{ display: 'block', marginTop: 4 }}>{formData.major} ({formData.year})</span>
                  </div>
                  <div>
                    <span className="detail-item-label">เกรดเฉลี่ยสะสม (GPAX)</span>
                    <span className="detail-item-value" style={{ display: 'block', marginTop: 4 }}>{Number(formData.gpax).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="detail-item-label">รายได้ครอบครัวต่อปี</span>
                    <span className="detail-item-value" style={{ display: 'block', marginTop: 4 }}>{Number(formData.familyIncome).toLocaleString()} บาท</span>
                  </div>
                  <div>
                    <span className="detail-item-label">เอกสารประกอบที่แนบ</span>
                    <span className="detail-item-value" style={{ color: '#16a34a', display: 'block', marginTop: 4 }}>
                      {Object.values(files).filter(Boolean).length} รายการ (ครบถ้วน)
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 16 }}>
                  <span className="detail-item-label">เหตุผลความจำเป็น</span>
                  <p style={{ fontSize: '0.88rem', color: '#0f172a', marginTop: 8, background: '#fff', padding: 12, borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    {formData.reason}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <input
                  type="checkbox"
                  id="consentCheck"
                  style={{ marginTop: 5 }}
                  checked={formData.consent}
                  onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                  required
                />
                <label htmlFor="consentCheck" style={{ fontSize: '0.88rem', color: '#334155' }}>
                  ข้าพเจ้าขอรับรองว่าข้อความและเอกสารที่ระบุในใบสมัครนี้เป็นความจริงทุกประการ หากตรวจสอบพบข้อความอันเป็นเท็จ ข้าพเจ้ายินยอมให้ตัดสิทธิ์การรับทุนทันที
                </label>
              </div>
            </div>
          )}

          <div className="wizard-footer-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
            {step > 1 ? (
              <button type="button" className="btn-wizard-back" onClick={handlePrev}>
                <span className="icon">←</span> ย้อนกลับ
              </button>
            ) : (
              <button type="button" className="btn-wizard-cancel" onClick={closeApplicationModal}>
                <span className="icon">✕</span> กลับไปหน้าหลัก
              </button>
            )}

            {step < 5 ? (
              <button type="button" className="btn-wizard-next" onClick={handleNext}>
                ขั้นตอนถัดไป <span className="icon">→</span>
              </button>
            ) : (
              <button type="submit" className="btn-wizard-submit">
                ยืนยันส่งใบสมัคร <span className="icon">✓</span>
              </button>
            )}
          </div>
        </form>
      </div>
      
      {/* Rating & Feedback Modal */}
      {isRatingModalOpen && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 99999,
            padding: '20px'
          }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '500px',
              width: '100%',
              padding: '32px',
              borderRadius: '24px',
              background: '#fff',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              position: 'relative'
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', color: '#0f172a' }}>ช่วยประเมินการใช้งานให้เราหน่อย 😊</h3>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '0.95rem' }}>ความคิดเห็นของคุณจะช่วยให้เราพัฒนาระบบให้ดียิ่งขึ้น</p>
            
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, systemRating: star })}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '3.5rem',
                      lineHeight: 1,
                      color: formData.systemRating >= star ? '#eab308' : '#e2e8f0',
                      transition: 'all 0.2s ease',
                      transform: formData.systemRating >= star ? 'scale(1.1)' : 'scale(1)'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ marginBottom: '24px', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>ข้อเสนอแนะเพิ่มเติม (ถ้ามี)</label>
              <textarea
                value={formData.systemComment}
                onChange={(e) => setFormData({ ...formData, systemComment: e.target.value })}
                placeholder="มีส่วนไหนที่ใช้งานยาก หรืออยากให้เราปรับปรุงเพิ่มเติมไหม?"
                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #cbd5e1', minHeight: '100px', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <button 
                type="button" 
                onClick={() => setIsRatingModalOpen(false)}
                style={{ flex: 1, padding: '14px', borderRadius: '12px', background: '#f1f5f9', color: '#475569', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '1rem' }}
              >
                ยกเลิก
              </button>
              <button 
                type="button" 
                onClick={handleFinalSubmit}
                style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'var(--math-green, #1F4F2C)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '1rem' }}
              >
                ส่งใบสมัคร
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
