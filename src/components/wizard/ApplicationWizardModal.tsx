import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useScholarship } from '../../context/ScholarshipContext';
import { Address, ApplicationFormData, UploadedFiles } from '../../types/application';
import { formatThaiDate } from '../../utils/dateFormatter';
import { calculateStudentYear, hasFilledPersonalInfo, normalizeMajorName, normalizePersonalInfo } from '../../utils/studentProfile';

const WIZARD_STEPS = [
  { id: 1, label: 'ข้อมูลนักศึกษา' },
  { id: 2, label: 'เหตุผลความจำเป็น' },
  { id: 3, label: 'ยืนยันการสมัคร' }
];

const MAJOR_OPTIONS = [
  'วท.บ. คณิตศาสตร์ประยุกต์ (MA) - โครงการปกติ',
  'วท.บ. คณิตศาสตร์ประยุกต์ (MA) - โครงการสมทบพิเศษ',
  'วท.บ. คณิตศาสตร์เชิงคอมพิวเตอร์ (MC) - โครงการปกติ',
  'วท.บ. คณิตศาสตร์เชิงคอมพิวเตอร์ (MC) - โครงการสมทบพิเศษ'
];

const YEAR_OPTIONS = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4', 'บัณฑิตศึกษา'];

const emptyAddress = (): Address => ({
  houseNo: '',
  moo: '',
  soi: '',
  road: '',
  subDistrict: '',
  district: '',
  province: '',
  zipCode: ''
});

/** คำถามชุดเดิม (ครอบครัว/กิจกรรม) ไม่ได้เก็บจากผู้สมัครแล้ว แต่คงโครงสร้างไว้ให้ผู้ดูแลระบบอ่านได้ */
const createEmptyForm = (): ApplicationFormData => ({
  scholarshipId: '',
  studentId: '',
  fullName: '',
  firstName: '',
  lastName: '',
  nickname: '',
  major: '',
  year: '',
  gpax: '',
  phone: '',
  email: '',
  address: emptyAddress(),
  isIdCardAddress: true,
  idCardAddress: emptyAddress(),

  fatherName: '',
  fatherPhone: '',
  fatherJob: '',
  fatherIncome: 0,
  fatherAlive: 'alive',

  motherName: '',
  motherPhone: '',
  motherJob: '',
  motherIncome: 0,
  motherAlive: 'alive',

  parentsRelation: 'together',
  familyIncome: 0,
  siblings: 0,

  sponsor: [],
  sponsorOther: '',
  loanStatus: 'none',
  loanAmount: 0,

  hasPartTimeJob: false,
  partTimeJobLocation: '',
  partTimeJobIncome: 0,

  hasActivities: false,
  activities: '',
  activityRole: '',
  volunteerHours: 0,
  activityList: [],

  reason: '',
  reasonsList: [],
  consent: false,
  systemRating: 0,
  systemComment: ''
});

const isValidThaiPhoneNumber = (value: string): boolean => {
  const digits = value.replace(/[\s()-]/g, '');
  return /^0(?:[2-7]\d{7,8}|[689]\d{8})$/.test(digits);
};

export const ApplicationWizardModal: React.FC = () => {
  const {
    isWizardModalOpen,
    closeApplicationModal,
    scholarships,
    selectedScholarshipIdForApply,
    submitApplication,
    showToast,
    currentUser,
    updateCurrentUser,
    openLoginModal
  } = useScholarship();

  const [step, setStep] = useState<number>(1);
  const [maxStepVisited, setMaxStepVisited] = useState<number>(1);
  const [formData, setFormData] = useState<ApplicationFormData>(createEmptyForm);
  const [files, setFiles] = useState<UploadedFiles>({
    doc1: null,
    doc2: null,
    doc3: null,
    profilePhoto: null
  });

  const isStudent = Boolean(currentUser && currentUser.role === 'student');

  // เมื่อเปิดหน้าต่างสมัคร: เติมข้อมูลส่วนตัวจากบัญชีที่เข้าสู่ระบบ
  useEffect(() => {
    if (!isWizardModalOpen) return;

    const targetScholarshipId = selectedScholarshipIdForApply || scholarships[0]?.id || '';
    const names = (currentUser?.name || '').trim().split(/\s+/);
    // ข้อมูลที่อยู่/ครอบครัว/กิจกรรม ดึงจากโปรไฟล์นักศึกษา (เมนู "ข้อมูลประกอบการพิจารณาทุน")
    const personalInfo = normalizePersonalInfo(currentUser?.personalInfo);

    setStep(1);
    setMaxStepVisited(1);
    setFiles(prev => ({ ...prev, profilePhoto: currentUser?.avatarUrl || null }));
    setFormData({
      ...createEmptyForm(),
      ...personalInfo,
      scholarshipId: targetScholarshipId,
      studentId: currentUser?.studentId || '',
      fullName: currentUser?.name || '',
      firstName: names[0] || '',
      lastName: names.slice(1).join(' '),
      email: currentUser?.email || '',
      phone: currentUser?.phone || '',
      major: normalizeMajorName(currentUser?.major),
      year: calculateStudentYear(currentUser?.studentId, currentUser?.year || 'ปี 1'),
      gpax: currentUser?.gpax !== undefined ? currentUser.gpax : ''
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWizardModalOpen]);

  // ถ้านักศึกษาเลือกทุนอื่นจากหน้าเว็บขณะเปิดฟอร์มอยู่
  useEffect(() => {
    if (!isWizardModalOpen || !selectedScholarshipIdForApply) return;
    setFormData(prev => ({ ...prev, scholarshipId: selectedScholarshipIdForApply }));
  }, [isWizardModalOpen, selectedScholarshipIdForApply]);

  if (!isWizardModalOpen) return null;

  const selectedScholarship = scholarships.find(s => s.id === formData.scholarshipId)
    || scholarships.find(s => s.id === selectedScholarshipIdForApply);
  const availableScholarships = scholarships.filter(s => s.status !== 'closed');
  const personalInfoReady = hasFilledPersonalInfo(currentUser?.personalInfo);

  const updateField = <K extends keyof ApplicationFormData>(key: K, value: ApplicationFormData[K]) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'studentId' && typeof value === 'string' && value.replace(/\D/g, '').length >= 2) {
        next.year = calculateStudentYear(value, prev.year);
      }
      return next;
    });
  };

  const reasonsList = formData.reasonsList && formData.reasonsList.length > 0
    ? formData.reasonsList
    : [''];

  const handleReasonChange = (index: number, val: string) => {
    const next = [...reasonsList];
    next[index] = val;
    const active = next.filter(r => r.trim());
    setFormData(prev => ({
      ...prev,
      reasonsList: next,
      reason: active.join('\n')
    }));
  };

  const handleAddReason = () => {
    if (reasonsList.length >= 5) return;
    setFormData(prev => ({
      ...prev,
      reasonsList: [...reasonsList, '']
    }));
  };

  const handleRemoveReason = (index: number) => {
    const next = reasonsList.filter((_, i) => i !== index);
    const safeNext = next.length > 0 ? next : [''];
    const active = safeNext.filter(r => r.trim());
    setFormData(prev => ({
      ...prev,
      reasonsList: safeNext,
      reason: active.join('\n')
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    if (!isStudent) {
      showToast('กรุณาเข้าสู่ระบบด้วยบัญชีนักศึกษาก่อนยื่นใบสมัคร', 'warning');
      return false;
    }

    if (currentStep === 1) {
      if (!formData.scholarshipId) {
        showToast('กรุณาเลือกทุนที่ต้องการสมัคร', 'warning');
        return false;
      }
      if (!formData.major.trim()) {
        showToast('กรุณาเลือกสาขาวิชา', 'warning');
        return false;
      }
      if (!formData.year.trim()) {
        showToast('กรุณาเลือกชั้นปี', 'warning');
        return false;
      }
      const gpaxNum = Number(formData.gpax);
      if (isNaN(gpaxNum) || gpaxNum < 0 || gpaxNum > 4) {
        showToast('กรุณากรอก GPAX ระหว่าง 0.00 - 4.00', 'warning');
        return false;
      }
      if (!isValidThaiPhoneNumber(formData.phone)) {
        showToast('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง เช่น 089-123-4567', 'warning');
        return false;
      }
    }

    // Step 2: เหตุผลความจำเป็น (ไม่บังคับกรอก หรือไม่เกิน 5 ข้อ)
    if (currentStep === 2) {
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    const nextStep = Math.min(step + 1, WIZARD_STEPS.length);
    setStep(nextStep);
    setMaxStepVisited(prev => Math.max(prev, nextStep));
  };

  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleStepClick = (targetStep: number) => {
    if (targetStep === step) return;
    if (targetStep < step) {
      setStep(targetStep);
      return;
    }
    if (targetStep <= maxStepVisited && validateStep(step)) {
      setStep(targetStep);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!isStudent) {
      showToast('กรุณาเข้าสู่ระบบด้วยบัญชีนักศึกษาก่อนยื่นใบสมัคร', 'warning');
      return;
    }
    if (!validateStep(1) || !validateStep(2)) {
      return;
    }
    if (!formData.consent) {
      showToast('กรุณากดยอมรับการรับรองข้อมูลก่อนส่งใบสมัคร', 'warning');
      return;
    }

    const activeReasons = reasonsList.filter(r => r.trim());
    const finalReason = activeReasons.join('\n');
    const gpaxNum = Number(formData.gpax);

    // ข้อมูลส่วนตัวที่แก้ในขั้นตอนที่ 1 จะถูกบันทึกกลับเข้าบัญชีนักศึกษา
    updateCurrentUser({
      major: formData.major,
      year: formData.year,
      gpax: gpaxNum,
      phone: formData.phone
    });

    submitApplication(
      {
        ...formData,
        gpax: gpaxNum,
        reason: finalReason,
        reasonsList: activeReasons,
        systemRating: 0,
        systemComment: ''
      },
      files
    );
  };

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          closeApplicationModal();
        }
      }}
    >
      <div className="wizard-modal-card">
        <div className="wizard-modal-header" style={{ padding: '16px 24px' }}>
          <h3 className="wizard-header-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            ใบสมัครขอรับทุนการศึกษา
          </h3>

          <button
            type="button"
            className="wizard-close-btn"
            onClick={closeApplicationModal}
            aria-label="ปิดหน้าต่าง"
            title="ปิดหน้าต่าง"
          >
            ✕
          </button>
        </div>

        {/* Desktop Stepper Bar */}
        <div className="wizard-stepper-bar">
          <div className="wizard-stepper-track">
            <div
              className="wizard-stepper-fill"
              style={{ width: `${((step - 1) / (WIZARD_STEPS.length - 1)) * 100}%` }}
            />
          </div>

          {WIZARD_STEPS.map(s => {
            const isDone = s.id < step;
            const isActive = s.id === step;
            return (
              <button
                key={s.id}
                type="button"
                className={`wizard-stepper-node ${isActive ? 'active' : ''} ${isDone ? 'done' : ''} ${s.id <= maxStepVisited ? 'clickable' : ''}`}
                onClick={() => handleStepClick(s.id)}
              >
                <div className="wizard-stepper-circle">{isDone ? '✓' : s.id}</div>
                <span className="wizard-stepper-label">{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile Stepper Indicator */}
        <div className="wizard-mobile-stepper">
          <div className="wizard-mobile-stepper-info">
            <span className="wizard-mobile-step-pill">
              ขั้นตอนที่ {step} จาก {WIZARD_STEPS.length}
            </span>
            <span className="wizard-mobile-step-title">{WIZARD_STEPS[step - 1]?.label}</span>
          </div>
          <div className="wizard-mobile-progress-track">
            <div
              className="wizard-mobile-progress-bar"
              style={{ width: `${(step / WIZARD_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="wizard-form-body">
          {/* STEP 1: ข้อมูลนักศึกษา (ดึงจากบัญชีที่เข้าสู่ระบบ) */}
          {step === 1 && (
            <div className="wizard-step-pane">
              {isStudent ? (
                <div className="wizard-section-card">
                  <div className="wizard-section-header">
                    <span className="wizard-section-title-clean">ข้อมูลจากบัญชีนักศึกษา</span>
                  </div>
                  <div style={{ display: 'grid', gap: 6, fontSize: '0.9rem', color: 'var(--navy-800)' }}>
                    <div>
                      <strong>{formData.fullName || '-'}</strong> (รหัส {formData.studentId || '-'})
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                      {formData.email || '-'}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      ข้อมูลนี้มาจากบัญชีที่เข้าสู่ระบบ แก้ไขได้ที่เมนูโปรไฟล์ของท่าน
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        padding: '8px 10px',
                        borderRadius: 10,
                        fontSize: '0.78rem',
                        lineHeight: 1.5,
                        background: personalInfoReady ? '#ecfdf5' : '#fffbeb',
                        border: `1px solid ${personalInfoReady ? '#a7f3d0' : '#fde68a'}`,
                        color: personalInfoReady ? '#047857' : '#92400e'
                      }}
                    >
                      {personalInfoReady
                        ? '✓ ระบบดึงข้อมูลที่อยู่ ครอบครัว เงินทุน และกิจกรรมจากโปรไฟล์ของท่านมาเติมในใบสมัครแล้ว'
                        : 'ยังไม่ได้กรอกข้อมูลที่อยู่/ครอบครัว/กิจกรรม — กรุณาเปิดเมนูโปรไฟล์ (มุมขวาบน) แล้วเลือก “ข้อมูลประกอบการพิจารณาทุน” เพื่อให้กรรมการพิจารณาได้ครบถ้วน'}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="wizard-section-card"
                  style={{ border: '1.5px solid #fde68a', background: '#fffbeb' }}
                >
                  <div className="wizard-section-header">
                    <span className="wizard-section-title-clean">ต้องเข้าสู่ระบบก่อนยื่นใบสมัคร</span>
                  </div>
                  <p style={{ margin: '0 0 12px', fontSize: '0.86rem', color: '#92400e' }}>
                    ระบบจะดึงข้อมูลส่วนตัวของท่านจากบัญชีนักศึกษาโดยอัตโนมัติ จึงไม่ต้องกรอกซ้ำในใบสมัคร
                  </p>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      closeApplicationModal();
                      openLoginModal();
                    }}
                  >
                    เข้าสู่ระบบ / สมัครสมาชิก
                  </button>
                </div>
              )}

              <div className="wizard-section-card">
                <div className="wizard-section-header">
                  <span className="wizard-section-title-clean">ทุนที่ต้องการสมัคร</span>
                </div>
                <div className="form-group">
                  <select
                    className="form-input-light"
                    value={formData.scholarshipId}
                    onChange={(e) => updateField('scholarshipId', e.target.value)}
                    required
                  >
                    <option value="">-- เลือกทุนการศึกษา --</option>
                    {availableScholarships.map(scholarship => (
                      <option key={scholarship.id} value={scholarship.id}>
                        {scholarship.title} ({scholarship.amount})
                      </option>
                    ))}
                  </select>
                </div>
                {selectedScholarship && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    เกณฑ์ขั้นต่ำ GPAX {selectedScholarship.minGPAX.toFixed(2)} • ปิดรับ{' '}
                    {formatThaiDate(selectedScholarship.deadline)} • เหลือ {selectedScholarship.remainingSlots} ทุน
                  </div>
                )}
              </div>

              <div className="wizard-section-card">
                <div className="wizard-section-header">
                  <span className="wizard-section-title-clean">ข้อมูลประกอบการพิจารณา</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="sub-label">สาขาวิชา *</label>
                    <select
                      className="form-input-light"
                      value={formData.major}
                      onChange={(e) => updateField('major', e.target.value)}
                      required
                    >
                      <option value="">-- เลือกสาขาวิชา --</option>
                      {formData.major && !MAJOR_OPTIONS.includes(formData.major) && (
                        <option value={formData.major}>{formData.major}</option>
                      )}
                      {MAJOR_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="sub-label">ชั้นปี *</label>
                    <select
                      className="form-input-light"
                      value={formData.year}
                      onChange={(e) => updateField('year', e.target.value)}
                      required
                    >
                      <option value="">-- เลือกชั้นปี --</option>
                      {formData.year && !YEAR_OPTIONS.includes(formData.year) && (
                        <option value={formData.year}>{formData.year}</option>
                      )}
                      {YEAR_OPTIONS.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="sub-label">เกรดเฉลี่ยสะสม (GPAX) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      className="form-input-light"
                      placeholder="เช่น 3.25"
                      value={formData.gpax}
                      onChange={(e) => updateField('gpax', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="sub-label">เบอร์โทรศัพท์ติดต่อ *</label>
                    <input
                      type="tel"
                      className="form-input-light"
                      placeholder="เช่น 089-123-4567"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: เหตุผลความจำเป็น */}
          {step === 2 && (
            <div className="wizard-step-pane">
              <div className="wizard-section-card">
                <div className="wizard-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="wizard-section-title-clean">เหตุผลความจำเป็นในการขอรับทุน</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {reasonsList.filter(r => r.trim()).length}/5 ข้อ
                  </span>
                </div>
                <p style={{ margin: '0 0 14px', fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  ระบุเหตุผลความจำเป็นและเป้าหมายในการใช้เงินทุน (เป็นข้อๆ สูงสุดไม่เกิน 5 ข้อ หรือเว้นว่างได้ ไม่บังคับกรอก)
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {reasonsList.map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: '#f1f5f9',
                          color: 'var(--navy-800)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          flexShrink: 0
                        }}
                      >
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        className="form-input-light"
                        placeholder={`ระบุเหตุผลข้อที่ ${idx + 1} (เช่น ครอบครัวมีภาระค่าใช้จ่ายสูง...)`}
                        value={item}
                        onChange={(e) => handleReasonChange(idx, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      {reasonsList.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveReason(idx)}
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            border: '1px solid #fee2e2',
                            background: '#fff5f5',
                            color: '#ef4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                          title="ลบข้อนี้"
                          aria-label="ลบข้อนี้"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {reasonsList.length < 5 && (
                  <button
                    type="button"
                    onClick={handleAddReason}
                    style={{
                      marginTop: 14,
                      padding: '8px 16px',
                      borderRadius: 8,
                      border: '1px dashed var(--math-green)',
                      background: 'rgba(7, 123, 56, 0.05)',
                      color: 'var(--math-green)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      alignSelf: 'flex-start'
                    }}
                  >
                    <Plus size={16} />
                    <span>เพิ่มข้อ ({reasonsList.length}/5)</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 3: ยืนยันการสมัคร */}
          {step === 3 && (
            <div className="wizard-step-pane">
              <div className="wizard-summary-sheet">
                <div className="wizard-summary-applicant">
                  {files.profilePhoto ? (
                    <img src={files.profilePhoto} alt="Applicant" className="wizard-summary-avatar" />
                  ) : (
                    <div
                      className="wizard-summary-avatar"
                      style={{
                        background: 'var(--math-green-soft)',
                        color: 'var(--math-green-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.1rem',
                        fontWeight: 700
                      }}
                    >
                      {formData.firstName ? formData.firstName.charAt(0) : 'นศ'}
                    </div>
                  )}

                  <div style={{ flex: 1 }}>
                    <h4 className="wizard-summary-name">{formData.fullName}</h4>
                    <div className="wizard-summary-sub">
                      รหัสนักศึกษา: <strong>{formData.studentId}</strong> • {formData.major} ({formData.year})
                    </div>
                  </div>

                  <button type="button" className="wizard-edit-btn" onClick={() => setStep(1)}>
                    แก้ไขข้อมูล
                  </button>
                </div>

                <div className="wizard-summary-grid">
                  <div className="wizard-summary-card">
                    <span className="wizard-summary-label">ทุนการศึกษา</span>
                    <div className="wizard-summary-val" style={{ color: 'var(--kmutnb-orange)' }}>
                      {selectedScholarship?.title || '-'}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                      {selectedScholarship?.amount || '-'}
                    </span>
                  </div>

                  <div className="wizard-summary-card">
                    <span className="wizard-summary-label">การติดต่อ</span>
                    <div className="wizard-summary-val">{formData.phone}</div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                      {formData.email}
                    </span>
                  </div>

                  <div className="wizard-summary-card">
                    <span className="wizard-summary-label">เกรดเฉลี่ยสะสม (GPAX)</span>
                    <div className="wizard-summary-val">{Number(formData.gpax).toFixed(2)}</div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginTop: 2 }}>
                      เกณฑ์ขั้นต่ำ {selectedScholarship ? selectedScholarship.minGPAX.toFixed(2) : '-'}
                    </span>
                  </div>
                </div>

                <div style={{ background: 'var(--surface-white)', padding: 14, borderRadius: 12, border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span className="wizard-summary-label" style={{ margin: 0 }}>เหตุผลความจำเป็น</span>
                    <button type="button" className="wizard-edit-btn" onClick={() => setStep(2)}>
                      แก้ไข
                    </button>
                  </div>
                  {reasonsList.filter(r => r.trim()).length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {reasonsList.filter(r => r.trim()).map((r, i) => (
                        <div key={i} style={{ fontSize: '0.88rem', color: 'var(--navy-800)', lineHeight: 1.6 }}>
                          <strong>{i + 1}.</strong> {r.trim()}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      (ไม่ได้ระบุเหตุผลความจำเป็น)
                    </p>
                  )}
                </div>

                <label className="wizard-consent-card">
                  <input
                    type="checkbox"
                    checked={formData.consent}
                    onChange={(e) => updateField('consent', e.target.checked)}
                    required
                  />
                  <div className="wizard-consent-text">
                    <strong>ข้าพเจ้าขอรับรองว่า</strong> ข้อความและเอกสารหลักฐานทั้งหมดที่ระบุในใบสมัครนี้เป็นความจริงทุกประการ หากตรวจพบข้อความอันเป็นเท็จ ข้าพเจ้ายินยอมให้ตัดสิทธิ์การรับทุนการศึกษาทันที
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Footer Actions Bar */}
          <div
            className="wizard-footer-actions"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-light)'
            }}
          >
            <div>
              {step > 1 ? (
                <button type="button" className="btn-wizard-back" onClick={handlePrev}>
                  <span className="icon">←</span>
                  <span>ย้อนกลับ</span>
                </button>
              ) : (
                <button type="button" className="btn-wizard-cancel" onClick={closeApplicationModal}>
                  <span className="icon">✕</span>
                  <span>ยกเลิก</span>
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {step} / {WIZARD_STEPS.length}
              </span>

              {step < WIZARD_STEPS.length ? (
                <button type="button" className="btn-wizard-next" onClick={handleNext}>
                  <span>ขั้นตอนถัดไป</span>
                  <span className="icon">→</span>
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-wizard-submit"
                  style={{
                    opacity: formData.consent ? 1 : 0.65,
                    cursor: formData.consent ? 'pointer' : 'not-allowed'
                  }}
                >
                  <span>ยืนยันส่งใบสมัคร</span>
                  <span className="icon">✓</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
