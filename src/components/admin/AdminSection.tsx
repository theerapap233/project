import React, { useState, useEffect } from 'react';
import { useScholarship } from '../../context/ScholarshipContext';
import { Application, ApplicationStatus } from '../../types/application';
import { Scholarship } from '../../types/scholarship';
import { Announcement, FaqItem } from '../../types/common';
import { formatThaiDate } from '../../utils/dateFormatter';

type AdminTab = 'applications' | 'scholarships' | 'news' | 'faq' | 'settings';

export const AdminSection: React.FC = () => {
  const { 
    applications, 
    scholarships,
    announcements,
    faqs,
    siteSettings,
    quickApprove, 
    exportApplicationsCSV, 
    createNewScholarship, 
    updateScholarship,
    deleteScholarship,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    addFaq,
    updateFaq,
    deleteFaq,
    updateSiteSettings,
    updateApplicationReview,
    setIsPreviewMode,
    showToast,
    isSupabaseConnected
  } = useScholarship();

  const [activeTab, setActiveTab] = useState<AdminTab>('applications');

  // Application Filter & Review states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<ApplicationStatus>('submitted');
  const [reviewScore, setReviewScore] = useState<number | ''>('');
  const [reviewInterviewDate, setReviewInterviewDate] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  // Scholarship Modal states
  const [isSchModalOpen, setIsSchModalOpen] = useState(false);
  const [editingSchId, setEditingSchId] = useState<string | null>(null);
  const [schTitle, setSchTitle] = useState('');
  const [schAmount, setSchAmount] = useState('25,000 บาท/ภาคการศึกษา');
  const [schSlots, setSchSlots] = useState(5);
  const [schDeadline, setSchDeadline] = useState('31 ตุลาคม 2567');
  const [schScope, setSchScope] = useState<'internal' | 'external'>('internal');
  const [schStatus, setSchStatus] = useState<'open' | 'closed' | 'closing_soon'>('open');
  const [schDesc, setSchDesc] = useState('');

  // Announcement Modal states
  const [isAnnModalOpen, setIsAnnModalOpen] = useState(false);
  const [editingAnnId, setEditingAnnId] = useState<string | null>(null);
  const [annTitle, setAnnTitle] = useState('');
  const [annDate, setAnnDate] = useState(new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }));
  const [annTag, setAnnTag] = useState('ประกาศสำคัญ');
  const [annTagType, setAnnTagType] = useState<'primary' | 'warning' | 'success'>('primary');
  const [annSummary, setAnnSummary] = useState('');

  // FAQ Modal states
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [editingFaqIndex, setEditingFaqIndex] = useState<number | null>(null);
  const [faqQuestion, setFaqQuestion] = useState('');
  const [faqAnswer, setFaqAnswer] = useState('');

  // Site Settings Form state
  const [settingsForm, setSettingsForm] = useState(siteSettings);

  useEffect(() => {
    setSettingsForm(siteSettings);
  }, [siteSettings]);

  // Statistics
  const totalApps = applications.length;
  const pendingDocs = applications.filter(a => a.status === 'submitted' || a.status === 'doc_verified').length;
  const interviewScheduled = applications.filter(a => a.status === 'interview_scheduled').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;

  // Filtered Applications
  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.scholarshipName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Handlers for Applications Review
  const handleOpenReview = (app: Application) => {
    setSelectedApp(app);
    setReviewStatus(app.status);
    setReviewScore(app.score ?? '');
    setReviewInterviewDate(app.interviewDate || '');
    setReviewNotes(app.committeeNotes || '');
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    updateApplicationReview(
      selectedApp.trackingId,
      reviewStatus,
      reviewScore === '' ? null : Number(reviewScore),
      reviewInterviewDate,
      reviewNotes
    );
    setIsReviewModalOpen(false);
  };

  // Handlers for Scholarships CMS
  const handleOpenNewSch = () => {
    setEditingSchId(null);
    setSchTitle('');
    setSchAmount('20,000 บาท/คน');
    setSchSlots(5);
    setSchDeadline('31 ตุลาคม 2567');
    setSchScope('internal');
    setSchStatus('open');
    setSchDesc('ทุนการศึกษาสำหรับนักศึกษาภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มจพ.');
    setIsSchModalOpen(true);
  };

  const handleOpenEditSch = (sch: Scholarship) => {
    setEditingSchId(sch.id);
    setSchTitle(sch.title);
    setSchAmount(sch.amount);
    setSchSlots(sch.totalSlots);
    setSchDeadline(sch.deadline);
    setSchScope(sch.scope || 'internal');
    setSchStatus(sch.status);
    setSchDesc(sch.description);
    setIsSchModalOpen(true);
  };

  const handleSaveSch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schTitle.trim()) {
      showToast('กรุณาระบุชื่อทุนการศึกษา', 'warning');
      return;
    }

    if (editingSchId) {
      updateScholarship(editingSchId, {
        title: schTitle.trim(),
        amount: schAmount.trim(),
        totalSlots: Number(schSlots),
        deadline: schDeadline.trim(),
        scope: schScope,
        status: schStatus,
        description: schDesc.trim()
      });
    } else {
      createNewScholarship(schTitle.trim(), schAmount.trim(), Number(schSlots));
    }
    setIsSchModalOpen(false);
  };

  const handleDeleteSch = (id: string, title: string) => {
    if (window.confirm(`ยืนยันการลบประกาศทุน "${title}" ใช่หรือไม่?`)) {
      deleteScholarship(id);
    }
  };

  // Handlers for Announcement CMS
  const handleOpenNewAnn = () => {
    setEditingAnnId(null);
    setAnnTitle('');
    setAnnDate(new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }));
    setAnnTag('ประกาศสำคัญ');
    setAnnTagType('primary');
    setAnnSummary('');
    setIsAnnModalOpen(true);
  };

  const handleOpenEditAnn = (ann: Announcement) => {
    setEditingAnnId(ann.id);
    setAnnTitle(ann.title);
    setAnnDate(ann.date);
    setAnnTag(ann.tag);
    setAnnTagType(ann.tagType);
    setAnnSummary(ann.summary);
    setIsAnnModalOpen(true);
  };

  const handleSaveAnn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim()) {
      showToast('กรุณาระบุหัวข้อข่าว/ประกาศ', 'warning');
      return;
    }

    if (editingAnnId) {
      updateAnnouncement(editingAnnId, {
        title: annTitle.trim(),
        date: annDate.trim(),
        tag: annTag,
        tagType: annTagType,
        summary: annSummary.trim()
      });
    } else {
      addAnnouncement({
        title: annTitle.trim(),
        date: annDate.trim(),
        tag: annTag,
        tagType: annTagType,
        summary: annSummary.trim(),
        linkText: 'อ่านประกาศฉบับเต็ม'
      });
    }
    setIsAnnModalOpen(false);
  };

  const handleDeleteAnn = (id: string, title: string) => {
    if (window.confirm(`ยืนยันการลบประกาศ "${title}" ใช่หรือไม่?`)) {
      deleteAnnouncement(id);
    }
  };

  // Handlers for FAQ CMS
  const handleOpenNewFaq = () => {
    setEditingFaqIndex(null);
    setFaqQuestion('');
    setFaqAnswer('');
    setIsFaqModalOpen(true);
  };

  const handleOpenEditFaq = (index: number, faq: FaqItem) => {
    setEditingFaqIndex(index);
    setFaqQuestion(faq.question);
    setFaqAnswer(faq.answer);
    setIsFaqModalOpen(true);
  };

  const handleSaveFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQuestion.trim() || !faqAnswer.trim()) {
      showToast('กรุณากรอกทั้งคำถามและคำตอบ', 'warning');
      return;
    }

    if (editingFaqIndex !== null) {
      updateFaq(editingFaqIndex, {
        question: faqQuestion.trim(),
        answer: faqAnswer.trim()
      });
    } else {
      addFaq({
        question: faqQuestion.trim(),
        answer: faqAnswer.trim()
      });
    }
    setIsFaqModalOpen(false);
  };

  const handleDeleteFaq = (index: number) => {
    if (window.confirm('ยืนยันการลบคำถามนี้ใช่หรือไม่?')) {
      deleteFaq(index);
    }
  };

  // Handlers for Site Settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings(settingsForm);
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'submitted':
        return <span className="status-badge" style={{ background: 'var(--info-bg, #eff6ff)', color: 'var(--info, #2563eb)' }}>ยื่นใบสมัครแล้ว</span>;
      case 'doc_verified':
        return <span className="status-badge" style={{ background: 'var(--warning-bg, #fffbeb)', color: 'var(--warning, #d97706)' }}>เอกสารผ่านแล้ว</span>;
      case 'interview_scheduled':
        return <span className="status-badge" style={{ background: 'var(--purple-bg, #faf5ff)', color: 'var(--purple, #9333ea)' }}>นัดสัมภาษณ์</span>;
      case 'approved':
        return <span className="status-badge" style={{ background: 'var(--success-bg, #f0fdf4)', color: 'var(--success, #16a34a)' }}>อนุมัติทุนแล้ว</span>;
      case 'rejected':
        return <span className="status-badge" style={{ background: 'var(--danger-bg, #fef2f2)', color: 'var(--danger, #dc2626)' }}>ไม่ผ่านการพิจารณา</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <section id="adminSection" className="admin-section" style={{ minHeight: 'calc(100vh - 160px)', background: 'var(--surface-ground)', paddingBottom: 60 }}>
      <div className="container">
        {/* Header Bar */}
        <div className="admin-header" style={{ marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>

              <h2 style={{ fontSize: '1.6rem', color: 'var(--navy-900, #0f172a)', margin: 0 }}>
                ระบบจัดการเว็บไซต์และทุนการศึกษา
              </h2>
            </div>
            <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem', margin: 0 }}>
              บริหารจัดการใบสมัคร ประกาศทุนการศึกษา ข่าวสารประชาสัมพันธ์ และเนื้อหาหน้าเว็บไซต์
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* PREVIEW BUTTON */}
            <button 
              className="btn btn-primary"
              onClick={() => {
                setIsPreviewMode(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                showToast('เข้าสู่โหมดดูตัวอย่างหน้าเว็บ (Preview Mode)', 'info');
              }}
              style={{ 
                background: 'linear-gradient(135deg, #077b38, #059669)',
                borderColor: '#059669',
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                padding: '8px 16px',
                fontWeight: 700,
                boxShadow: '0 4px 12px rgba(7, 123, 56, 0.3)'
              }}
              title="ดูตัวอย่างหน้าเว็บไซต์ตามมุมมองของนักศึกษา"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>ดูตัวอย่างหน้าเว็บ (Preview)</span>
            </button>

            <button 
              className="btn btn-secondary btn-sm" 
              onClick={exportApplicationsCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              ส่งออก CSV
            </button>

          </div>
        </div>

        {/* Navigation Tabs for CMS */}
        <div style={{
          display: 'flex',
          gap: 6,
          background: 'var(--surface-card)',
          padding: '6px',
          borderRadius: '12px',
          border: '1px solid var(--border-light, #e2e8f0)',
          marginBottom: 24,
          overflowX: 'auto'
        }}>
          <button
            onClick={() => setActiveTab('applications')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'applications' ? 'var(--math-green, #077b38)' : 'transparent',
              color: activeTab === 'applications' ? 'white' : 'var(--navy-700, #334155)',
              fontWeight: activeTab === 'applications' ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <span>📋</span>
            <span>จัดการใบสมัคร</span>
            <span style={{
              background: activeTab === 'applications' ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
              color: activeTab === 'applications' ? 'white' : '#475569',
              padding: '1px 7px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {applications.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('scholarships')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'scholarships' ? 'var(--math-green, #077b38)' : 'transparent',
              color: activeTab === 'scholarships' ? 'white' : 'var(--navy-700, #334155)',
              fontWeight: activeTab === 'scholarships' ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <span>🎓</span>
            <span>จัดการประกาศทุน</span>
            <span style={{
              background: activeTab === 'scholarships' ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
              color: activeTab === 'scholarships' ? 'white' : '#475569',
              padding: '1px 7px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {scholarships.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('news')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'news' ? 'var(--math-green, #077b38)' : 'transparent',
              color: activeTab === 'news' ? 'white' : 'var(--navy-700, #334155)',
              fontWeight: activeTab === 'news' ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <span>📢</span>
            <span>จัดการข่าวสาร & ประกาศ</span>
            <span style={{
              background: activeTab === 'news' ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
              color: activeTab === 'news' ? 'white' : '#475569',
              padding: '1px 7px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {announcements.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'faq' ? 'var(--math-green, #077b38)' : 'transparent',
              color: activeTab === 'faq' ? 'white' : 'var(--navy-700, #334155)',
              fontWeight: activeTab === 'faq' ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <span>❓</span>
            <span>คำถามที่พบบ่อย (FAQ)</span>
            <span style={{
              background: activeTab === 'faq' ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
              color: activeTab === 'faq' ? 'white' : '#475569',
              padding: '1px 7px',
              borderRadius: '10px',
              fontSize: '0.75rem',
              fontWeight: 700
            }}>
              {faqs.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'settings' ? 'var(--math-green, #077b38)' : 'transparent',
              color: activeTab === 'settings' ? 'white' : 'var(--navy-700, #334155)',
              fontWeight: activeTab === 'settings' ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <span>⚙️</span>
            <span>ตั้งค่าเว็บไซต์</span>
          </button>
        </div>

        {/* TAB 1: APPLICATIONS MANAGEMENT */}
        {activeTab === 'applications' && (
          <div>
            {/* KPI Grid */}
            <div className="admin-kpi-grid">
              <div className="kpi-card" style={{ borderLeft: '4px solid var(--navy-700, #334155)' }}>
                <div className="kpi-card-header">
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>ใบสมัครทั้งหมด</span>
                  <span style={{ fontSize: '1.2rem' }}>📋</span>
                </div>
                <div className="kpi-value">{totalApps}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>จากทุกประกาศทุน</div>
              </div>

              <div className="kpi-card" style={{ borderLeft: '4px solid #d97706' }}>
                <div className="kpi-card-header">
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>รอตรวจสอบเอกสาร</span>
                  <span style={{ fontSize: '1.2rem' }}>⏳</span>
                </div>
                <div className="kpi-value" style={{ color: '#d97706' }}>{pendingDocs}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>ต้องตรวจสอบคุณสมบัติ</div>
              </div>

              <div className="kpi-card" style={{ borderLeft: '4px solid #9333ea' }}>
                <div className="kpi-card-header">
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>นัดหมายสัมภาษณ์</span>
                  <span style={{ fontSize: '1.2rem' }}>🎙️</span>
                </div>
                <div className="kpi-value" style={{ color: '#9333ea' }}>{interviewScheduled}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>รอผลการสัมภาษณ์</div>
              </div>

              <div className="kpi-card" style={{ borderLeft: '4px solid var(--math-green, #077b38)' }}>
                <div className="kpi-card-header">
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontWeight: 600 }}>อนุมัติทุนแล้ว</span>
                  <span style={{ fontSize: '1.2rem' }}>🎉</span>
                </div>
                <div className="kpi-value" style={{ color: 'var(--math-green, #077b38)' }}>{approvedCount}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>พร้อมทำสัญญารับทุน</div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ 
              background: 'var(--surface-card)', 
              padding: '16px 20px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-light, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 20
            }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <input 
                  type="text" 
                  className="form-input-light" 
                  placeholder="ค้นหาชื่อผู้สมัคร, รหัสนักศึกษา, รหัสติดตาม, หรือชื่อทุน..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>สถานะ:</span>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="form-input-light"
                  style={{ width: 'auto', padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  <option value="all">ทั้งหมด ({applications.length})</option>
                  <option value="submitted">ยื่นใบสมัครแล้ว</option>
                  <option value="doc_verified">เอกสารผ่านแล้ว</option>
                  <option value="interview_scheduled">นัดสัมภาษณ์</option>
                  <option value="approved">อนุมัติทุนแล้ว</option>
                  <option value="rejected">ไม่ผ่านการพิจารณา</option>
                </select>
              </div>
            </div>

            {/* Applications Table */}
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>รหัสติดตาม</th>
                    <th>ผู้สมัคร</th>
                    <th>สาขาวิชา / ชั้นปี</th>
                    <th>ทุนที่สมัคร</th>
                    <th style={{ textAlign: 'center' }}>GPAX</th>
                    <th>วันที่ยื่น</th>
                    <th style={{ textAlign: 'center' }}>สถานะ</th>
                    <th style={{ textAlign: 'center' }}>คะแนน</th>
                    <th style={{ textAlign: 'right' }}>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                        ไม่พบข้อมูลใบสมัครที่ตรงกับเงื่อนไขการค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => (
                      <tr key={app.trackingId}>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--navy-900)' }}>
                            {app.trackingId}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{app.fullName}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{app.studentId} • {app.phone}</div>
                        </td>
                        <td>
                          <div>{app.major}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{app.year}</div>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>
                            {app.scholarshipName}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--math-green)' }}>
                          {app.gpax.toFixed(2)}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {formatThaiDate(app.submissionDate)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          {getStatusBadge(app.status)}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>
                          {app.score !== null ? `${app.score}/100` : '-'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button 
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleOpenReview(app)}
                              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                              title="พิจารณาใบสมัครและบันทึกคะแนน"
                            >
                              ตรวจ/พิจารณา
                            </button>
                            {app.status !== 'approved' && (
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => quickApprove(app.trackingId)}
                                style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                title="อนุมัติทุนทันที"
                              >
                                อนุมัติ
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SCHOLARSHIPS CMS */}
        {activeTab === 'scholarships' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--navy-900)' }}>
                  รายการประกาศทุนการศึกษาทั้งหมด ({scholarships.length} ทุน)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  จัดการรายละเอียดทุน จำนวนที่เปิดรับ วันปิดรับสมัคร และเงื่อนไขทุนการศึกษา
                </p>
              </div>
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleOpenNewSch}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>➕</span> เพิ่มประกาศทุนใหม่
              </button>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ชื่อทุนการศึกษา</th>
                    <th>ประเภท</th>
                    <th>มูลค่าทุน</th>
                    <th style={{ textAlign: 'center' }}>จำนวนรับ (คน)</th>
                    <th>วันปิดรับสมัคร</th>
                    <th style={{ textAlign: 'center' }}>สถานะ</th>
                    <th style={{ textAlign: 'right' }}>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {scholarships.map((sch) => (
                    <tr key={sch.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{sch.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', maxWidth: 380, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {sch.description}
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: '0.75rem', 
                          background: sch.scope === 'internal' ? 'var(--math-green-subtle, #e8f5e9)' : 'var(--kmutnb-orange-subtle, #fff3e0)', 
                          color: sch.scope === 'internal' ? 'var(--math-green, #077b38)' : 'var(--kmutnb-orange, #e65100)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontWeight: 600
                        }}>
                          {sch.scope === 'internal' ? 'ทุนภายในภาควิชา' : 'ทุนภายนอก/เครือข่าย'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--navy-900)' }}>
                        {sch.amount}
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>
                        {sch.totalSlots}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {sch.deadline}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: 600,
                          background: sch.status === 'open' ? '#DCFCE7' : sch.status === 'closing_soon' ? '#FEF3C7' : '#F1F5F9',
                          color: sch.status === 'open' ? '#166534' : sch.status === 'closing_soon' ? '#B45309' : '#64748B'
                        }}>
                          {sch.status === 'open' ? 'เปิดรับสมัคร' : sch.status === 'closing_soon' ? 'ใกล้ปิดรับ' : 'ปิดรับแล้ว'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: 6 }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEditSch(sch)}
                            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          >
                            แก้ไข
                          </button>
                          <button 
                            className="btn btn-sm"
                            onClick={() => handleDeleteSch(sch.id, sch.title)}
                            style={{ padding: '4px 8px', fontSize: '0.78rem', color: '#dc2626', borderColor: '#fca5a5', background: 'var(--danger-bg)' }}
                            title="ลบทุนนี้"
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: NEWS & ANNOUNCEMENTS CMS */}
        {activeTab === 'news' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--navy-900)' }}>
                  ข่าวสารและประกาศ ({announcements.length} รายการ)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  จัดการข่าวสาร ประกาศผล และการแจ้งเตือนต่างๆ
                </p>
              </div>
              <button 
                className="btn btn-primary"
                onClick={handleOpenNewAnn}
              >
                + เพิ่มประกาศ
              </button>
            </div>
            
            <div className="table-responsive" style={{ background: 'var(--surface-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead style={{ background: 'var(--surface-ground)' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>วันที่</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>ประเภท</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>หัวข้อประกาศ</th>
                    <th style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map(ann => (
                    <tr key={ann.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px 16px', width: '120px' }}>{ann.date}</td>
                      <td style={{ padding: '12px 16px', width: '100px' }}>{ann.tag}</td>
                      <td style={{ padding: '12px 16px' }}>{ann.title}</td>
                      <td style={{ padding: '12px 16px', width: '140px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => handleOpenEditAnn(ann)}
                            style={{ padding: '4px 8px', fontSize: '0.78rem' }}
                          >
                            แก้ไข
                          </button>
                          <button 
                            className="btn btn-sm"
                            onClick={() => handleDeleteAnn(ann.id, ann.title)}
                            style={{ padding: '4px 8px', fontSize: '0.78rem', color: '#dc2626', borderColor: '#fca5a5', background: 'var(--danger-bg)' }}
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FAQ & HELP CMS */}
        {activeTab === 'faq' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--navy-900)' }}>
                  คำถามที่พบบ่อย (FAQ) ({faqs.length} รายการ)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  จัดการคำถาม-คำตอบเพื่อช่วยเหลือนักศึกษาในการสมัครทุนการศึกษา
                </p>
              </div>
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleOpenNewFaq}
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>➕</span> เพิ่มคำถาม-คำตอบ
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {faqs.map((faq, index) => (
                <div key={index} style={{
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-light, #e2e8f0)',
                  borderRadius: '10px',
                  padding: '16px 20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 16
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '0.95rem', marginBottom: 6 }}>
                      ❓ {faq.question}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--navy-700)', lineHeight: 1.6 }}>
                      {faq.answer}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEditFaq(index, faq)}
                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                    >
                      แก้ไข
                    </button>
                    <button 
                      className="btn btn-sm"
                      onClick={() => handleDeleteFaq(index)}
                      style={{ padding: '4px 8px', fontSize: '0.78rem', color: '#dc2626', borderColor: '#fca5a5', background: 'var(--danger-bg)' }}
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: SITE SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ background: 'var(--surface-card)', border: '1px solid var(--border-light, #e2e8f0)', borderRadius: '12px', padding: '24px 28px', maxWidth: 840 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '1.25rem', color: 'var(--navy-900)' }}>
                  ⚙️ ตั้งค่าเว็บไซต์ทั่วไป (Site Settings)
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  ปรับแต่งข้อมูลหลักของเว็บไซต์ ปีการศึกษา ข้อความหัวเรื่อง และข้อมูลติดต่อ
                </p>
              </div>

            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    ปีการศึกษา (Academic Year)
                  </label>
                  <input 
                    type="text" 
                    list="academic-years"
                    className="form-input-light"
                    value={settingsForm.academicYear}
                    onChange={(e) => setSettingsForm({ ...settingsForm, academicYear: e.target.value })}
                    required
                  />
                  <datalist id="academic-years">
                    <option value={new Date().getFullYear() + 543 - 1} />
                    <option value={new Date().getFullYear() + 543} />
                    <option value={new Date().getFullYear() + 543 + 1} />
                  </datalist>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    ภาคการศึกษา (Semester)
                  </label>
                  <select 
                    className="form-input-light"
                    value={settingsForm.semester}
                    onChange={(e) => setSettingsForm({ ...settingsForm, semester: e.target.value })}
                    required
                    style={{ width: '100%' }}
                  >
                    <option value="" disabled>เลือกภาคการศึกษา</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                  ข้อความพาดหัวหน้าแรก (Hero Title)
                </label>
                <textarea 
                  className="form-input-light" 
                  rows={2}
                  value={settingsForm.heroTitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                  คำอธิบายหน้าแรก (Hero Subtitle)
                </label>
                <textarea 
                  className="form-input-light" 
                  rows={3}
                  value={settingsForm.heroSubtitle}
                  onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                  ข้อความแถบวิ่งประชาสัมพันธ์ (Marquee Ticker Text)
                </label>
                <input 
                  type="text" 
                  className="form-input-light"
                  value={settingsForm.tickerText || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, tickerText: e.target.value })}
                  placeholder="เช่น 📢 เปิดรับสมัครทุนการศึกษาภาควิชาคณิตศาสตร์ ประจำภาคการศึกษาที่ 1/2567..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    เบอร์โทรศัพท์ติดต่อ
                  </label>
                  <input 
                    type="text" 
                    className="form-input-light"
                    value={settingsForm.contactPhone}
                    onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    อีเมลติดต่อ
                  </label>
                  <input 
                    type="email" 
                    className="form-input-light"
                    value={settingsForm.contactEmail}
                    onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                  ที่ตั้งสำนักงานภาควิชา
                </label>
                <input 
                  type="text" 
                  className="form-input-light"
                  value={settingsForm.contactAddress || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, contactAddress: e.target.value })}
                  placeholder="เช่น อาคาร 78 ชั้น 7 คณะวิทยาศาสตร์ประยุกต์ มจพ."
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                  ลิงก์ Facebook Fanpage
                </label>
                <input 
                  type="url" 
                  className="form-input-light"
                  value={settingsForm.facebookUrl || ''}
                  onChange={(e) => setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })}
                  placeholder="https://facebook.com/..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="submit" className="btn btn-primary" style={{ minWidth: 160 }}>
                  บันทึกการตั้งค่า
                </button>
              </div>
            </form>
          </div>

        )}
      </div>

      {/* MODAL: REVIEW APPLICATION */}
      {isReviewModalOpen && selectedApp && (
        <div className="modal-backdrop open">
          <div className="modal-card" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                พิจารณาใบสมัคร: {selectedApp.trackingId}
              </h3>
              <button className="modal-close-btn" onClick={() => setIsReviewModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSaveReview}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--surface-ground, #f8fafc)', padding: 14, borderRadius: 8, fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600, color: 'var(--navy-900)', marginBottom: 4 }}>
                    {selectedApp.fullName} (รหัสนักศึกษา: {selectedApp.studentId})
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>
                    ทุน: {selectedApp.scholarshipName} | เกรดเฉลี่ย: {selectedApp.gpax.toFixed(2)}
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    สถานะการพิจารณา
                  </label>
                  <select 
                    className="form-input-light"
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as ApplicationStatus)}
                  >
                    <option value="submitted">ยื่นใบสมัครแล้ว (รอตรวจเอกสาร)</option>
                    <option value="doc_verified">เอกสารผ่านการตรวจสอบแล้ว</option>
                    <option value="interview_scheduled">นัดหมายสัมภาษณ์</option>
                    <option value="approved">อนุมัติทุนการศึกษา</option>
                    <option value="rejected">ไม่ผ่านการคัดเลือก</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    คะแนนประเมิน (เต็ม 100 คะแนน)
                  </label>
                  <input 
                    type="number" 
                    className="form-input-light"
                    placeholder="เช่น 85"
                    min="0"
                    max="100"
                    value={reviewScore}
                    onChange={(e) => setReviewScore(e.target.value === '' ? '' : Number(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    วัน-เวลานัดสัมภาษณ์ (ถ้ามี)
                  </label>
                  <input 
                    type="text" 
                    className="form-input-light"
                    placeholder="เช่น 28 กันยายน 2567 เวลา 10:00 น. ห้อง 704 อาคาร 78"
                    value={reviewInterviewDate}
                    onChange={(e) => setReviewInterviewDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    ความเห็นคณะกรรมการ / บันทึกเพิ่มเติม
                  </label>
                  <textarea 
                    className="form-input-light"
                    rows={3}
                    placeholder="กรอกผลการพิจารณาคุณสมบัติ หรือข้อเสนอแนะของคณะกรรมการ..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsReviewModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  บันทึกผลการพิจารณา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SCHOLARSHIP */}
      {isSchModalOpen && (
        <div className="modal-backdrop open">
          <div className="modal-card" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                {editingSchId ? 'แก้ไขประกาศทุนการศึกษา' : 'เพิ่มประกาศทุนการศึกษาใหม่'}
              </h3>
              <button className="modal-close-btn" onClick={() => setIsSchModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSaveSch}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    ชื่อทุนการศึกษา
                  </label>
                  <input 
                    type="text" 
                    className="form-input-light" 
                    placeholder="เช่น ทุนพัฒนาทักษะวิจัยคณิตศาสตร์ประยุกต์"
                    value={schTitle}
                    onChange={(e) => setSchTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                      มูลค่าทุน
                    </label>
                    <input 
                      type="text" 
                      className="form-input-light" 
                      placeholder="เช่น 20,000 บาท/คน"
                      value={schAmount}
                      onChange={(e) => setSchAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                      จำนวนรับ (คน)
                    </label>
                    <input 
                      type="number" 
                      className="form-input-light" 
                      min="1"
                      max="100"
                      value={schSlots}
                      onChange={(e) => setSchSlots(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                      ประเภทแหล่งทุน
                    </label>
                    <select 
                      className="form-input-light"
                      value={schScope}
                      onChange={(e) => setSchScope(e.target.value as 'internal' | 'external')}
                    >
                      <option value="internal">ทุนภายในภาควิชาคณิตศาสตร์</option>
                      <option value="external">ทุนภายนอก / องค์กรเครือข่าย</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                      สถานะการเปิดรับ
                    </label>
                    <select 
                      className="form-input-light"
                      value={schStatus}
                      onChange={(e) => setSchStatus(e.target.value as 'open' | 'closed' | 'closing_soon')}
                    >
                      <option value="open">เปิดรับสมัคร</option>
                      <option value="closing_soon">ใกล้ปิดรับสมัคร</option>
                      <option value="closed">ปิดรับสมัครแล้ว</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    กำหนดการปิดรับสมัคร
                  </label>
                  <input 
                    type="text" 
                    className="form-input-light" 
                    placeholder="เช่น 31 ตุลาคม 2567"
                    value={schDeadline}
                    onChange={(e) => setSchDeadline(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    รายละเอียด / วัตถุประสงค์ทุน
                  </label>
                  <textarea 
                    className="form-input-light" 
                    rows={3}
                    placeholder="ระบุรายละเอียดทุน คุณสมบัติ และเงื่อนไขเบื้องต้น..."
                    value={schDesc}
                    onChange={(e) => setSchDesc(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsSchModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  {editingSchId ? 'บันทึกการแก้ไข' : 'สร้างประกาศทุน'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT ANNOUNCEMENT */}
      {isAnnModalOpen && (
        <div className="modal-backdrop open">
          <div className="modal-card" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                {editingAnnId ? 'แก้ไขข่าวสาร/ประกาศ' : 'เพิ่มข่าวสาร/ประกาศใหม่'}
              </h3>
              <button className="modal-close-btn" onClick={() => setIsAnnModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSaveAnn}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    หัวข้อข่าว/ประกาศ
                  </label>
                  <input 
                    type="text" 
                    className="form-input-light" 
                    placeholder="เช่น กำหนดการสัมภาษณ์ทุนการศึกษารอบที่ 2"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                      ป้ายกำกับ (Tag)
                    </label>
                    <input 
                      type="text" 
                      className="form-input-light" 
                      placeholder="เช่น ประกาศสำคัญ, นัดสัมภาษณ์"
                      value={annTag}
                      onChange={(e) => setAnnTag(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                      รูปแบบสีป้ายกำกับ
                    </label>
                    <select 
                      className="form-input-light"
                      value={annTagType}
                      onChange={(e) => setAnnTagType(e.target.value as 'primary' | 'warning' | 'success')}
                    >
                      <option value="primary">น้ำเงิน (ประกาศสำคัญ/ทั่วไป)</option>
                      <option value="warning">ส้ม/เหลือง (นัดสัมภาษณ์/ด่วน)</option>
                      <option value="success">เขียว (ผลการพิจารณา/กิจกรรม)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    วันที่ประกาศ
                  </label>
                  <input 
                    type="text" 
                    className="form-input-light" 
                    value={annDate}
                    onChange={(e) => setAnnDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    เนื้อหาย่อข่าวสาร
                  </label>
                  <textarea 
                    className="form-input-light" 
                    rows={3}
                    placeholder="กรอกสรุปเนื้อหาข่าวสาร หรือข้อมูลที่ต้องการแจ้งให้นักศึกษาทราบ..."
                    value={annSummary}
                    onChange={(e) => setAnnSummary(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsAnnModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  {editingAnnId ? 'บันทึกการแก้ไข' : 'โพสต์ประกาศ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT FAQ */}
      {isFaqModalOpen && (
        <div className="modal-backdrop open">
          <div className="modal-card" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
                {editingFaqIndex !== null ? 'แก้ไขคำถาม-คำตอบ' : 'เพิ่มคำถาม-คำตอบใหม่'}
              </h3>
              <button className="modal-close-btn" onClick={() => setIsFaqModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSaveFaq}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    คำถาม (Question)
                  </label>
                  <input 
                    type="text" 
                    className="form-input-light" 
                    placeholder="เช่น สามารถสมัครทุนมากกว่า 1 ทุนได้หรือไม่?"
                    value={faqQuestion}
                    onChange={(e) => setFaqQuestion(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                    คำตอบ (Answer)
                  </label>
                  <textarea 
                    className="form-input-light" 
                    rows={4}
                    placeholder="พิมพ์คำตอบเพื่ออธิบายให้นักศึกษาเข้าใจ..."
                    value={faqAnswer}
                    onChange={(e) => setFaqAnswer(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setIsFaqModalOpen(false)}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  บันทึกคำถาม-คำตอบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
