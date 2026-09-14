import React, { useState, useEffect } from 'react';
import { useScholarship } from '../../context/ScholarshipContext';
import { ApplicationFormData, UploadedFiles } from '../../types/application';

const INITIAL_FORM: ApplicationFormData = {
  scholarshipId: '',
  studentId: '6604062610099',
  fullName: 'นายสมคิด มุ่งมั่นวิทยา',
  major: 'คณิตศาสตร์ประยุกต์',
  year: 'ปี 2',
  gpax: 3.45,
  phone: '089-123-4567',
  email: 's6604062610099@kmutnb.ac.th',
  fatherName: 'นายประสิทธิ์ มุ่งมั่นวิทยา',
  fatherJob: 'รับจ้างทั่วไป',
  motherName: 'นางมาลี มุ่งมั่นวิทยา',
  motherJob: 'ค้าขาย',
  familyIncome: 240000,
  siblings: 2,
  loanStatus: 'none',
  volunteerHours: 35,
  activities: 'ค่ายคณิตศาสตร์สัญจร มจพ., อาสาสมัครจัดเตรียมงานสัปดาห์วิทยาศาสตร์',
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
  const [files, setFiles] = useState<UploadedFiles>({
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

  const simulateFileUpload = (key: keyof UploadedFiles) => {
    const mockFiles: Record<keyof UploadedFiles, string> = {
      doc1: 'Official_Transcript_Term1.pdf (1.2 MB)',
      doc2: 'KMUTNB_StudentID_Card.pdf (850 KB)',
      doc3: 'Income_Certification_Official.pdf (1.8 MB)'
    };
    setFiles(prev => ({ ...prev, [key]: mockFiles[key] }));
    showToast(`อัปโหลดเอกสารสำเร็จ: ${mockFiles[key]}`, 'success');
  };

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
    }

    if (currentStep === 2) {
      if (!formData.familyIncome || formData.familyIncome < 0) {
        showToast('กรุณากรอกรายได้รวมครอบครัวต่อปี', 'warning');
        return false;
      }
    }

    if (currentStep === 3) {
      if (!formData.reason || formData.reason.trim().length < 10) {
        showToast('กรุณากรอกเรียงความแสดงเหตุผลความจำเป็นในการขอรับทุนอย่างน้อย 10 ตัวอักษร', 'warning');
        return false;
      }
    }

    if (currentStep === 4) {
      // Auto-simulate if missing
      if (!files.doc1) {
        simulateFileUpload('doc1');
      }
      if (!files.doc2) {
        simulateFileUpload('doc2');
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
              { num: 2, label: 'ข้อมูลครอบครัว' },
              { num: 3, label: 'กิจกรรม & เหตุผล' },
              { num: 4, label: 'เอกสารแนบ' },
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
                    <label>เลือกประเภททุนการศึกษาที่ประสงค์จะสมัคร *</label>
                    <select 
                      className="form-input-light" 
                      value={formData.scholarshipId}
                      onChange={(e) => setFormData({ ...formData, scholarshipId: e.target.value })}
                      required
                    >
                      {scholarships.map(s => (
                        <option key={s.id} value={s.id}>{s.title} ({s.amount})</option>
                      ))}
                    </select>
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
                    <label>สาขาวิชา *</label>
                    <select 
                      className="form-input-light" 
                      value={formData.major}
                      onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                      required
                    >
                      <option value="คณิตศาสตร์ประยุกต์">คณิตศาสตร์ประยุกต์ (Applied Math)</option>
                      <option value="สถิติประยุกต์และการวิเคราะห์ข้อมูล">สถิติประยุกต์และการวิเคราะห์ข้อมูล (Applied Statistics)</option>
                      <option value="คณิตศาสตร์การเงิน">คณิตศาสตร์การเงิน (Financial Math)</option>
                      <option value="บัณฑิตศึกษาคณิตศาสตร์">ระดับบัณฑิตศึกษา (ป.โท / ป.เอก)</option>
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

                  <div className="form-group full-width">
                    <label>อีเมลมหาวิทยาลัย (s...@kmutnb.ac.th) *</label>
                    <input 
                      type="email" 
                      className="form-input-light" 
                      placeholder="s6604062610099@kmutnb.ac.th" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Family & Financial Info */}
            {step === 2 && (
              <div className="wizard-step-pane">
                <h4 style={{ marginBottom: 16, fontSize: '1.1rem', color: 'var(--kmutnb-orange)' }}>
                  ขั้นตอนที่ 2: ข้อมูลครอบครัวและสถานะทางการเงิน
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label>ชื่อ-นามสกุล บิดา</label>
                    <input 
                      type="text" 
                      className="form-input-light" 
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>อาชีพบิดา</label>
                    <input 
                      type="text" 
                      className="form-input-light" 
                      value={formData.fatherJob}
                      onChange={(e) => setFormData({ ...formData, fatherJob: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>ชื่อ-นามสกุล มารดา</label>
                    <input 
                      type="text" 
                      className="form-input-light" 
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>อาชีพมารดา</label>
                    <input 
                      type="text" 
                      className="form-input-light" 
                      value={formData.motherJob}
                      onChange={(e) => setFormData({ ...formData, motherJob: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>รายได้รวมของครอบครัวต่อปี (บาท) *</label>
                    <input 
                      type="number" 
                      className="form-input-light" 
                      value={formData.familyIncome}
                      onChange={(e) => setFormData({ ...formData, familyIncome: parseFloat(e.target.value) || 0 })}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>จำนวนพี่น้องร่วมบิดามารดา (คน)</label>
                    <input 
                      type="number" 
                      className="form-input-light" 
                      min="1" 
                      value={formData.siblings}
                      onChange={(e) => setFormData({ ...formData, siblings: parseInt(e.target.value, 10) || 1 })}
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>สถานะการกู้ยืมกองทุนเพื่อการศึกษา</label>
                    <select 
                      className="form-input-light"
                      value={formData.loanStatus}
                      onChange={(e) => setFormData({ ...formData, loanStatus: e.target.value as 'none' | 'กยศ' | 'กรอ' })}
                    >
                      <option value="none">ไม่ได้กู้ยืม กยศ. / กรอ.</option>
                      <option value="กยศ">กู้ยืมกองทุน กยศ.</option>
                      <option value="กรอ">กู้ยืมกองทุน กรอ.</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Activities & Statement */}
            {step === 3 && (
              <div className="wizard-step-pane">
                <h4 style={{ marginBottom: 16, fontSize: '1.1rem', color: 'var(--kmutnb-orange)' }}>
                  ขั้นตอนที่ 3: กิจกรรมจิตสาธารณะ และเหตุผลการขอรับทุน
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="form-group">
                    <label>ชั่วโมงกิจกรรม / จิตอาสาสะสม (ชั่วโมง)</label>
                    <input 
                      type="number" 
                      className="form-input-light" 
                      min="0" 
                      value={formData.volunteerHours}
                      onChange={(e) => setFormData({ ...formData, volunteerHours: parseInt(e.target.value, 10) || 0 })}
                    />
                  </div>
                  <div className="form-group">
                    <label>กิจกรรมเด่นหรือผลงานทางวิชาการที่เคยเข้าร่วม</label>
                    <textarea 
                      className="form-input-light" 
                      rows={3} 
                      value={formData.activities}
                      onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>เรียงความแสดงเหตุผลและความจำเป็นในการขอรับทุนการศึกษา (Statement of Need) *</label>
                    <textarea 
                      className="form-input-light" 
                      rows={5} 
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      required 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Documents Upload Simulation */}
            {step === 4 && (
              <div className="wizard-step-pane">
                <h4 style={{ marginBottom: 16, fontSize: '1.1rem', color: 'var(--kmutnb-orange)' }}>
                  ขั้นตอนที่ 4: อัปโหลดเอกสารประกอบการสมัคร
                </h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                  กรุณาแนบไฟล์เอกสารในรูปแบบ PDF หรือรูปภาพ (PNG/JPG) ขนาดไม่เกิน 5 MB ต่อไฟล์
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div className="file-upload-zone" onClick={() => simulateFileUpload('doc1')}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📄</div>
                    <strong>1. สำเนาใบแสดงผลการเรียน (Transcript) *</strong>
                    <div style={{ fontSize: '0.8rem', color: files.doc1 ? 'var(--success)' : 'var(--text-muted)', marginTop: 4 }}>
                      {files.doc1 ? `✓ แนบไฟล์สำเร็จ: ${files.doc1}` : 'คลิกเพื่อจำลองการเลือกไฟล์'}
                    </div>
                  </div>

                  <div className="file-upload-zone" onClick={() => simulateFileUpload('doc2')}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>🪪</div>
                    <strong>2. สำเนาบัตรประจำตัวนักศึกษา และบัตรประชาชน *</strong>
                    <div style={{ fontSize: '0.8rem', color: files.doc2 ? 'var(--success)' : 'var(--text-muted)', marginTop: 4 }}>
                      {files.doc2 ? `✓ แนบไฟล์สำเร็จ: ${files.doc2}` : 'คลิกเพื่อจำลองการเลือกไฟล์'}
                    </div>
                  </div>

                  <div className="file-upload-zone" onClick={() => simulateFileUpload('doc3')}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>📑</div>
                    <strong>3. หนังสือรับรองรายได้ครอบครัว / หลักฐานผลงาน (ถ้ามี)</strong>
                    <div style={{ fontSize: '0.8rem', color: files.doc3 ? 'var(--success)' : 'var(--text-muted)', marginTop: 4 }}>
                      {files.doc3 ? `✓ แนบไฟล์สำเร็จ: ${files.doc3}` : 'คลิกเพื่อจำลองการเลือกไฟล์'}
                    </div>
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
                    <p style={{ fontSize: '0.88rem', color: 'var(--navy-800)', marginTop: 4, background: 'white', padding: 10, borderRadius: 'var(--radius-sm)' }}>
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
