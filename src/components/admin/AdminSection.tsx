import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronDown, 
  Pencil, 
  Trash2, 
  FileText, 
  GraduationCap, 
  Bell, 
  HelpCircle, 
  Settings, 
  Clock, 
  CheckCircle2, 
  Search,
  Calendar,
  Plus,
  Eye,
  Check,
  Printer,
  RotateCcw,
  X,
  XCircle
} from 'lucide-react';
import { useScholarship } from '../../context/ScholarshipContext';
import { Application, ApplicationStatus, ApplicationFormData } from '../../types/application';
import { Scholarship } from '../../types/scholarship';
import { Announcement, FaqItem } from '../../types/common';
import { formatThaiDate } from '../../utils/dateFormatter';
import { PROVINCES } from '../../data/provinces';

type AdminTab = 'applications' | 'scholarships' | 'news' | 'faq' | 'settings';

export const AdminSection: React.FC = () => {
  const { 
    applications, 
    scholarships,
    announcements,
    faqs,
    siteSettings,
    quickApprove, 
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
    updateApplicationDetails,
    updateApplicationReview,
    deleteApplication,
    showToast
  } = useScholarship();

  const [activeTab, setActiveTab] = useState<AdminTab>('applications');

  // Application Filter & Review states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterScope, setFilterScope] = useState<'all' | 'internal' | 'external'>('all');
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [appModalTab, setAppModalTab] = useState<number>(1);
  const [appEditData, setAppEditData] = useState<ApplicationFormData | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ApplicationStatus>('submitted');
  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    type: 'list' | 'application';
    targetAppId?: string;
  }>({
    isOpen: false,
    type: 'list'
  });

  const getFullAddressText = (addr?: { houseNo?: string; moo?: string; soi?: string; road?: string; subDistrict?: string; district?: string; province?: string; zipCode?: string }) => {
    if (!addr) return '-';
    const parts = [
      addr.houseNo ? `บ้านเลขที่ ${addr.houseNo}` : '',
      addr.moo ? `หมู่ ${addr.moo}` : '',
      addr.soi ? `ซอย${addr.soi}` : '',
      addr.road ? `ถนน${addr.road}` : '',
      addr.subDistrict ? `ต./แขวง ${addr.subDistrict}` : '',
      addr.district ? `อ./เขต ${addr.district}` : '',
      addr.province ? `จ.${addr.province}` : '',
      addr.zipCode ? addr.zipCode : ''
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : '-';
  };
  const [appProfilePhoto, setAppProfilePhoto] = useState<string | null>(null);

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
  const submittedCount = applications.filter(a => a.status === 'submitted').length;
  const approvedCount = applications.filter(a => a.status === 'approved').length;
  const rejectedCount = applications.filter(a => a.status === 'rejected').length;

  // Helper to find matching scholarship info
  const getAppScholarshipInfo = (app: Application) => {
    return scholarships.find(s => 
      s.id === app.scholarshipId || 
      (s.code && s.code === app.scholarshipId) || 
      s.title === app.scholarshipName || 
      app.scholarshipName.includes(s.title) ||
      s.title.includes(app.scholarshipName) ||
      (s.code && app.scholarshipName.includes(s.code))
    );
  };

  const checkAppMatchesType = (app: Application, typeVal: string) => {
    if (typeVal === 'all') return true;
    const sch = getAppScholarshipInfo(app);
    if (typeVal === 'internal') {
      return sch ? sch.scope === 'internal' : !app.scholarshipName.includes('ศิษย์เก่า');
    }
    if (typeVal === 'external') {
      return sch ? sch.scope === 'external' : app.scholarshipName.includes('ศิษย์เก่า');
    }

    // Direct match by scholarship ID, code, or title
    if (sch) {
      if (sch.id === typeVal || sch.code === typeVal || sch.title === typeVal) return true;
    }
    if (app.scholarshipId === typeVal || app.scholarshipName === typeVal || app.scholarshipName.includes(typeVal)) {
      return true;
    }

    // Fallbacks for categories
    if (typeVal === 'academic') {
      return (sch?.category === 'academic') || app.scholarshipName.includes('เรียนดี') || app.scholarshipName.includes('MATH-EXC');
    }
    if (typeVal === 'need') {
      return (sch?.category === 'need') || app.scholarshipName.includes('ขาดแคลน') || app.scholarshipName.includes('MATH-AID');
    }
    if (typeVal === 'work') {
      return (sch?.category === 'work') || app.scholarshipName.includes('ผู้ช่วยสอน') || app.scholarshipName.includes('TA') || app.scholarshipName.includes('MATH-TA');
    }
    if (typeVal === 'alumni') {
      return (sch?.category === 'alumni') || app.scholarshipName.includes('ศิษย์เก่า') || app.scholarshipName.includes('MATH-ALUMNI');
    }
    if (typeVal === 'activity') {
      return (sch?.category === 'activity') || app.scholarshipName.includes('จิตสาธารณะ') || app.scholarshipName.includes('MATH-VOLUNTEER');
    }

    return false;
  };

  const getFilterTypeLabel = (typeVal: string) => {
    if (typeVal === 'all') return 'ทุนการศึกษาทั้งหมด';
    if (typeVal === 'internal') return 'ทุนภายใน';
    if (typeVal === 'external') return 'ทุนภายนอก';
    const sch = scholarships.find(s => s.id === typeVal || s.code === typeVal || s.title === typeVal);
    if (sch) return sch.title;
    return typeVal;
  };

  const checkAppMatchesScope = (app: Application, scopeVal: string) => {
    if (scopeVal === 'all') return true;
    const sch = getAppScholarshipInfo(app);
    const appScope = sch ? sch.scope : (app.scholarshipName.includes('ศิษย์เก่า') ? 'external' : 'internal');
    return appScope === scopeVal;
  };

  const internalAppsCount = useMemo(() => {
    return applications.filter(a => checkAppMatchesScope(a, 'internal')).length;
  }, [applications]);

  const externalAppsCount = useMemo(() => {
    return applications.filter(a => checkAppMatchesScope(a, 'external')).length;
  }, [applications]);

  const filteredScholarshipsForSelect = useMemo(() => {
    if (filterScope === 'internal') {
      return scholarships.filter(s => s.scope === 'internal');
    }
    if (filterScope === 'external') {
      return scholarships.filter(s => s.scope === 'external');
    }
    return scholarships;
  }, [scholarships, filterScope]);

  const handleScopeChange = (newScope: 'all' | 'internal' | 'external') => {
    setFilterScope(newScope);
    if (newScope !== 'all' && filterType !== 'all') {
      const selectedSch = scholarships.find(s => s.id === filterType);
      if (selectedSch && selectedSch.scope !== newScope) {
        setFilterType('all');
      }
    }
  };

  // Filtered Applications
  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.trackingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.scholarshipName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    const matchesScope = checkAppMatchesScope(app, filterScope);
    const matchesType = checkAppMatchesType(app, filterType);

    return matchesSearch && matchesStatus && matchesScope && matchesType;
  });

  // Multi-select state
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const selectedAppsList = useMemo(() => {
    return filteredApps.filter(app => selectedAppIds.has(app.trackingId));
  }, [filteredApps, selectedAppIds]);

  const printListApps = useMemo(() => {
    if (selectedAppIds.size > 0) {
      return selectedAppsList;
    }
    return filteredApps;
  }, [filteredApps, selectedAppsList, selectedAppIds]);

  const handleToggleApp = (trackingId: string) => {
    setSelectedAppIds(prev => {
      const next = new Set(prev);
      if (next.has(trackingId)) {
        next.delete(trackingId);
      } else {
        next.add(trackingId);
      }
      if (next.size === 0) {
        setIsSelectionMode(false);
      } else {
        setIsSelectionMode(true);
      }
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedAppIds.size === filteredApps.length && filteredApps.length > 0) {
      setSelectedAppIds(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedAppIds(new Set(filteredApps.map(a => a.trackingId)));
      setIsSelectionMode(true);
    }
  };

  const handleClearSelection = () => {
    setSelectedAppIds(new Set());
    setIsSelectionMode(false);
  };

  const handleRowClick = (app: Application) => {
    if (isSelectionMode || selectedAppIds.size > 0) {
      handleToggleApp(app.trackingId);
    }
  };

  const handlePrintList = () => {
    setPrintModalState({
      isOpen: true,
      type: 'list'
    });
  };

  const handlePrintApplications = (appId?: string) => {
    let target = appId;
    if (!target) {
      if (selectedAppIds.size > 0) {
        target = 'selected';
      } else {
        target = 'all';
      }
    }
    setPrintModalState({
      isOpen: true,
      type: 'application',
      targetAppId: target
    });
  };

  // Handlers for Applications View & Edit
  const handleOpenReview = (app: Application) => {
    setSelectedApp(app);
    setAppModalTab(1);
    setIsEditMode(false);

    const fallbackForm: ApplicationFormData = app.formData ? JSON.parse(JSON.stringify(app.formData)) : {
      scholarshipId: app.scholarshipId || (scholarships[0]?.id || ''),
      studentId: app.studentId || '',
      fullName: app.fullName || '',
      nickname: '',
      major: app.major || 'MA โครงการปกติ',
      year: app.year || 'ปี 2',
      gpax: app.gpax || 3.00,
      phone: app.phone || '',
      email: app.email || '',
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
      familyIncome: app.familyIncome || 240000,
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
      reason: 'ครอบครัวมีภาระค่าใช้จ่ายสูง\nต้องการนำเงินมาแบ่งเบาภาระค่าใช้จ่ายในการครองชีพ และค่าอุปกรณ์การเรียน',
      reasonsList: [
        'ครอบครัวมีภาระค่าใช้จ่ายสูง',
        'ต้องการนำเงินมาแบ่งเบาภาระค่าใช้จ่ายในการครองชีพ และค่าอุปกรณ์การเรียน'
      ],
      consent: true
    };

    setAppEditData(fallbackForm);
    setReviewStatus(app.status);
    setAppProfilePhoto(app.profilePhoto || null);
    setIsReviewModalOpen(true);
  };

  const handleSaveReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditMode) {
      setIsEditMode(true);
      return;
    }
    if (!selectedApp || !appEditData) return;

    const targetSch = scholarships.find(s => s.id === appEditData.scholarshipId);

    const updatedApp: Application = {
      ...selectedApp,
      scholarshipId: appEditData.scholarshipId,
      scholarshipName: targetSch ? targetSch.title : selectedApp.scholarshipName,
      studentId: appEditData.studentId,
      fullName: appEditData.fullName,
      major: appEditData.major,
      year: appEditData.year,
      gpax: Number(appEditData.gpax),
      phone: appEditData.phone,
      email: appEditData.email,
      familyIncome: Number(appEditData.familyIncome) || ((Number(appEditData.fatherIncome || 0) + Number(appEditData.motherIncome || 0)) * 12),
      status: reviewStatus,
      score: selectedApp.score ?? null,
      interviewDate: selectedApp.interviewDate || '',
      committeeNotes: selectedApp.committeeNotes || '',
      documents: [],
      profilePhoto: appProfilePhoto,
      formData: {
        ...appEditData,
        activities: (appEditData.activityList || []).map(a => a.name).filter(Boolean).join(', ') || appEditData.activities,
        reason: (appEditData.reasonsList || []).filter(Boolean).join('\n') || appEditData.reason
      }
    };

    updateApplicationDetails(updatedApp);
    setIsReviewModalOpen(false);
  };

  const handleDeleteCurrentApp = () => {
    if (!selectedApp) return;
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบใบสมัครของ "${selectedApp.fullName}" (${selectedApp.trackingId}) ออกจากระบบ?`)) {
      deleteApplication(selectedApp.trackingId);
      setIsReviewModalOpen(false);
    }
  };

  const handleRevertStatus = (trackingId: string) => {
    const target = applications.find(a => a.trackingId === trackingId);
    if (!target || target.status !== 'approved') return;

    if (window.confirm(`ยืนยันการย้อนกลับสถานะของ "${target.fullName}" จาก "อนุมัติทุนแล้ว" เป็น "ยื่นใบสมัครแล้ว (รอพิจารณา)" ใช่หรือไม่?`)) {
      updateApplicationReview(
        trackingId,
        'submitted',
        null,
        '',
        'ย้อนกลับสถานะจากอนุมัติทุนแล้วเป็นยื่นใบสมัครแล้ว (รอพิจารณา)'
      );
    }
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

  const formatMajorAbbr = (major: string): string => {
    if (!major) return 'MA';
    const text = major.trim();
    if (text.includes('MC') || text.includes('คอมพิวเตอร์')) return 'MC';
    if (text.includes('MA') || text.includes('ประยุกต์')) return 'MA';
    if (text.includes('สถิติ')) return 'AS';
    return text;
  };

  const formatMajorFullName = (major: string): string => {
    if (!major) return 'คณิตศาสตร์ประยุกต์ (MA)';
    const text = major.trim();
    if (text.includes('MC') || text.includes('คอมพิวเตอร์')) return 'คณิตศาสตร์เชิงคำนวณ (MC)';
    if (text.includes('AS') || text.includes('สถิติ')) return 'สถิติประยุกต์และการวิเคราะห์ข้อมูล (AS)';
    if (text.includes('FM') || text.includes('การเงิน')) return 'คณิตศาสตร์การเงิน (FM)';
    if (text.includes('MA') || text.includes('ประยุกต์')) return 'คณิตศาสตร์ประยุกต์ (MA)';
    return text;
  };


  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'submitted':
        return (
          <span 
            className="status-badge" 
            style={{ 
              background: '#eff6ff', 
              color: '#1d4ed8', 
              border: '1px solid #bfdbfe', 
              fontWeight: 600, 
              padding: '4px 12px', 
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 3px rgba(37, 99, 235, 0.08)'
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb' }} />
            ยื่นใบสมัครแล้ว
          </span>
        );
      case 'approved':
        return (
          <span 
            className="status-badge" 
            style={{ 
              background: '#f0fdf4', 
              color: '#047857', 
              border: '1px solid #86efac', 
              fontWeight: 600, 
              padding: '4px 12px', 
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 3px rgba(16, 185, 129, 0.08)'
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            อนุมัติทุนแล้ว
          </span>
        );
      case 'rejected':
        return (
          <span 
            className="status-badge" 
            style={{ 
              background: '#fef2f2', 
              color: '#b91c1c', 
              border: '1px solid #fecaca', 
              fontWeight: 600, 
              padding: '4px 12px', 
              borderRadius: '20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 3px rgba(239, 68, 68, 0.08)'
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
            ไม่ผ่านการพิจารณา
          </span>
        );
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
              <h2 style={{ fontSize: '1.6rem', color: 'var(--navy-900, #0f172a)', margin: 0, fontWeight: 800 }}>
                ระบบจัดการเว็บไซต์และทุนการศึกษา
              </h2>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                Staff Portal
              </span>
            </div>
            <p style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9rem', margin: 0 }}>
              บริหารจัดการใบสมัคร ประกาศทุนการศึกษา ข่าวสารประชาสัมพันธ์ และเนื้อหาหน้าเว็บไซต์
            </p>
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
            <FileText size={16} />
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
            <GraduationCap size={16} />
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
            <Bell size={16} />
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
            <HelpCircle size={16} />
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
            <Settings size={16} />
            <span>ตั้งค่าเว็บไซต์</span>
          </button>
        </div>

        {/* TAB 1: APPLICATIONS MANAGEMENT */}
        {activeTab === 'applications' && (
          <div>
            {/* KPI Grid */}
            <div className="admin-kpi-grid">
              {/* Card 1: ใบสมัครทั้งหมด */}
              <div 
                className="kpi-card" 
                onClick={() => setFilterStatus('all')}
                style={{ 
                  border: '1px solid var(--border-light)', 
                  borderTop: '3px solid var(--info)', 
                  borderRadius: '8px', 
                  background: filterStatus === 'all' ? '#f0f9ff' : '#ffffff', 
                  padding: '16px 20px', 
                  boxShadow: filterStatus === 'all' ? '0 0 0 2px #38bdf8, var(--shadow-sm)' : 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="คลิกเพื่อกรอง: ใบสมัครทั้งหมด"
              >
                <div className="kpi-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.86rem', color: '#1e3a8a', fontWeight: 600 }}>ใบสมัครทั้งหมด</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '8px', background: '#dbeafe', border: '1px solid #93c5fd', color: '#1d4ed8' }}>
                    <FileText size={17} strokeWidth={2} />
                  </div>
                </div>
                <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1d4ed8', marginTop: 8 }}>{totalApps}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>จากทุกประกาศทุน</div>
              </div>

              {/* Card 2: รอตรวจสอบคุณสมบัติ */}
              <div 
                className="kpi-card" 
                onClick={() => setFilterStatus('submitted')}
                style={{ 
                  border: '1px solid var(--border-light)', 
                  borderTop: '3px solid #3b82f6', 
                  borderRadius: '8px', 
                  background: filterStatus === 'submitted' ? '#eff6ff' : '#ffffff', 
                  padding: '16px 20px', 
                  boxShadow: filterStatus === 'submitted' ? '0 0 0 2px #60a5fa, var(--shadow-sm)' : 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="คลิกเพื่อกรอง: รอตรวจสอบคุณสมบัติ (ยื่นแล้ว)"
              >
                <div className="kpi-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.86rem', color: '#1e40af', fontWeight: 600 }}>รอตรวจสอบคุณสมบัติ</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#2563eb' }}>
                    <Clock size={17} strokeWidth={2} />
                  </div>
                </div>
                <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb', marginTop: 8 }}>{submittedCount}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>ยื่นใบสมัครแล้ว</div>
              </div>


              {/* Card 3: อนุมัติทุนแล้ว */}
              <div 
                className="kpi-card" 
                onClick={() => setFilterStatus('approved')}
                style={{ 
                  border: '1px solid var(--border-light)', 
                  borderTop: '3px solid var(--success)', 
                  borderRadius: '8px', 
                  background: filterStatus === 'approved' ? '#f0fdf4' : '#ffffff', 
                  padding: '16px 20px', 
                  boxShadow: filterStatus === 'approved' ? '0 0 0 2px #4ade80, var(--shadow-sm)' : 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="คลิกเพื่อกรอง: อนุมัติทุนแล้ว"
              >
                <div className="kpi-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.86rem', color: '#064e3b', fontWeight: 600 }}>อนุมัติทุนแล้ว</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '8px', background: '#dcfce7', border: '1px solid #86efac', color: '#059669' }}>
                    <CheckCircle2 size={17} strokeWidth={2} />
                  </div>
                </div>
                <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#047857', marginTop: 8 }}>{approvedCount}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>พร้อมทำสัญญารับทุน</div>
              </div>

              {/* Card 4: ไม่ผ่านการพิจารณา */}
              <div 
                className="kpi-card" 
                onClick={() => setFilterStatus('rejected')}
                style={{ 
                  border: '1px solid var(--border-light)', 
                  borderTop: '3px solid #dc2626', 
                  borderRadius: '8px', 
                  background: filterStatus === 'rejected' ? '#fef2f2' : '#ffffff', 
                  padding: '16px 20px', 
                  boxShadow: filterStatus === 'rejected' ? '0 0 0 2px #f87171, var(--shadow-sm)' : 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="คลิกเพื่อกรอง: ไม่ผ่านการพิจารณา"
              >
                <div className="kpi-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.86rem', color: '#991b1b', fontWeight: 600 }}>ไม่ผ่านการพิจารณา</span>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: '8px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626' }}>
                    <XCircle size={17} strokeWidth={2} />
                  </div>
                </div>
                <div className="kpi-value" style={{ fontSize: '1.75rem', fontWeight: 800, color: '#dc2626', marginTop: 8 }}>{rejectedCount}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: 4 }}>ไม่ผ่านการคัดเลือก</div>
              </div>
            </div>

            {/* Search & Combobox Filters (ปีการศึกษา, สถานะ) */}
            <div style={{ 
              background: 'var(--surface-card)', 
              padding: '12px 16px', 
              borderRadius: '12px', 
              border: '1px solid var(--border-light, #e2e8f0)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 14
            }}>
              {/* Search Input */}
              <div style={{ position: 'relative', flex: '1 1 260px' }}>
                <Search size={16} strokeWidth={1.8} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  className="form-input-light" 
                  placeholder="ค้นหาชื่อผู้สมัคร, รหัสนักศึกษา หรือชื่อทุน..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ fontSize: '0.88rem', paddingLeft: 38, height: '42px', borderRadius: '8px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Combobox: ประเภททุน (ทุนภายใน / ทุนภายนอก) */}
              <div style={{ position: 'relative', minWidth: 165 }}>
                <select
                  value={filterScope}
                  onChange={(e) => handleScopeChange(e.target.value as any)}
                  className="form-input-light"
                  style={{
                    height: '42px',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    color: filterScope !== 'all' ? (filterScope === 'internal' ? 'var(--math-green, #077b38)' : '#ea580c') : 'var(--navy-800, #1e293b)',
                    background: filterScope !== 'all' ? (filterScope === 'internal' ? '#ecfdf5' : '#fff7ed') : 'var(--surface-ground, #f8fafc)',
                    borderColor: filterScope !== 'all' ? (filterScope === 'internal' ? '#a7f3d0' : '#fed7aa') : 'var(--border-light, #e2e8f0)',
                    paddingLeft: 12,
                    paddingRight: 28,
                    cursor: 'pointer',
                    width: '100%',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                >
                  <option value="all">ประเภททุน: ทั้งหมด</option>
                  <option value="internal">ทุนภายใน ({internalAppsCount})</option>
                  <option value="external">ทุนภายนอก ({externalAppsCount})</option>
                </select>
              </div>

              {/* Combobox: ชื่อข้อมูลทุน (เชื่อมโยงตามประเภททุนที่เลือก) */}
              <div style={{ position: 'relative', minWidth: 190, maxWidth: 320 }}>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="form-input-light"
                  style={{
                    height: '42px',
                    borderRadius: '8px',
                    fontSize: '0.86rem',
                    fontWeight: 500,
                    color: filterType !== 'all' ? '#0369a1' : 'var(--navy-800, #1e293b)',
                    background: filterType !== 'all' ? '#e0f2fe' : 'var(--surface-ground, #f8fafc)',
                    borderColor: filterType !== 'all' ? '#38bdf8' : 'var(--border-light, #e2e8f0)',
                    paddingLeft: 12,
                    paddingRight: 28,
                    cursor: 'pointer',
                    width: '100%',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                >
                  <option value="all">
                    {filterScope === 'internal' 
                      ? 'ชื่อข้อมูลทุน: ทุนภายในทั้งหมด' 
                      : filterScope === 'external' 
                        ? 'ชื่อข้อมูลทุน: ทุนภายนอกทั้งหมด' 
                        : 'ชื่อข้อมูลทุน: ทั้งหมด'}
                  </option>
                  {filteredScholarshipsForSelect.map(sch => {
                    const count = applications.filter(a => checkAppMatchesType(a, sch.id)).length;
                    return (
                      <option key={sch.id} value={sch.id}>
                        {sch.title} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Reset filter button if any active (เฉพาะประเภททุนและชื่อข้อมูลทุน) */}
              {(filterType !== 'all' || filterScope !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterType('all');
                    setFilterScope('all');
                  }}
                  style={{
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                  title="ล้างค่าตัวกรองประเภททุนและข้อมูลทุน"
                >
                  ล้างตัวกรอง
                </button>
              )}
            </div>

            {/* Filter: สถานะใบสมัคร & ปุ่มพิมพ์รายงาน (1. รายชื่อ 2. ใบสมัคร) */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 600, 
                  color: 'var(--navy-800)', 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Clock size={15} color="var(--math-green, #077b38)" />
                  <span>สถานะใบสมัคร:</span>
                </span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { 
                    value: 'all', 
                    label: 'ทั้งหมด', 
                    count: applications.length,
                    activeBg: 'var(--math-green, #077b38)',
                    activeBorder: 'var(--math-green, #077b38)',
                    activeColor: '#ffffff',
                    inactiveBg: '#f0fdf4',
                    inactiveBorder: '#bbf7d0',
                    inactiveColor: 'var(--math-green)',
                    badgeBg: '#dcfce7',
                    badgeText: '#065f46',
                    activeBadgeBg: 'rgba(255,255,255,0.28)',
                    activeBadgeText: '#ffffff',
                    shadow: '0 2px 8px rgba(7, 123, 56, 0.35)'
                  },
                  { 
                    value: 'submitted', 
                    label: 'ยื่นใบสมัครแล้ว', 
                    count: applications.filter(a => a.status === 'submitted').length,
                    activeBg: '#2563eb',
                    activeBorder: '#2563eb',
                    activeColor: '#ffffff',
                    inactiveBg: '#eff6ff',
                    inactiveBorder: '#bfdbfe',
                    inactiveColor: '#1d4ed8',
                    badgeBg: '#dbeafe',
                    badgeText: '#1e40af',
                    activeBadgeBg: 'rgba(255,255,255,0.28)',
                    activeBadgeText: '#ffffff',
                    shadow: '0 2px 8px rgba(37, 99, 235, 0.35)'
                  },
                  { 
                    value: 'approved', 
                    label: 'อนุมัติทุนแล้ว', 
                    count: applications.filter(a => a.status === 'approved').length,
                    activeBg: '#059669',
                    activeBorder: '#059669',
                    activeColor: '#ffffff',
                    inactiveBg: '#f0fdf4',
                    inactiveBorder: '#bbf7d0',
                    inactiveColor: '#047857',
                    badgeBg: '#dcfce7',
                    badgeText: '#065f46',
                    activeBadgeBg: 'rgba(255,255,255,0.28)',
                    activeBadgeText: '#ffffff',
                    shadow: '0 2px 8px rgba(5, 150, 105, 0.35)'
                  },
                  { 
                    value: 'rejected', 
                    label: 'ไม่ผ่านการพิจารณา', 
                    count: applications.filter(a => a.status === 'rejected').length,
                    activeBg: '#dc2626',
                    activeBorder: '#dc2626',
                    activeColor: '#ffffff',
                    inactiveBg: '#fef2f2',
                    inactiveBorder: '#fecaca',
                    inactiveColor: '#be123c',
                    badgeBg: '#fee2e2',
                    badgeText: '#b91c1c',
                    activeBadgeBg: 'rgba(255,255,255,0.28)',
                    activeBadgeText: '#ffffff',
                    shadow: '0 2px 8px rgba(220, 38, 38, 0.35)'
                  }
                ].map((opt) => {
                  const isActive = filterStatus === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFilterStatus(opt.value)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '0.82rem',
                        fontWeight: isActive ? 700 : 600,
                        border: `1px solid ${isActive ? opt.activeBorder : opt.inactiveBorder}`,
                        background: isActive ? opt.activeBg : opt.inactiveBg,
                        color: isActive ? opt.activeColor : opt.inactiveColor,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        boxShadow: isActive ? opt.shadow : '0 1px 3px rgba(0,0,0,0.03)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span>{opt.label}</span>
                      <span style={{
                        fontSize: '0.72rem',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        background: isActive ? opt.activeBadgeBg : opt.badgeBg,
                        color: isActive ? opt.activeBadgeText : opt.badgeText,
                        fontWeight: 700
                      }}>
                        {opt.count}
                      </span>
                    </button>
                  );
                })}
                </div>
              </div>

            </div>

            {/* Helper Tip & Multi-Select Action Bar */}
            {selectedAppIds.size > 0 ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 16px',
                background: 'var(--math-green)',
                borderRadius: '6px',
                color: '#ffffff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                marginBottom: 12,
                flexWrap: 'wrap',
                gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    background: '#ffffff',
                    color: 'var(--math-green)',
                    fontWeight: 800,
                    fontSize: '0.84rem',
                    padding: '2px 9px',
                    borderRadius: '999px'
                  }}>
                    {selectedAppIds.size}
                  </span>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                    เลือกอยู่ {selectedAppIds.size} คน จากทั้งหมด {filteredApps.length} คน (พร้อมสำหรับสั่งพิมพ์)
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={handlePrintList}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: '7px',
                      background: '#ffffff',
                      color: 'var(--math-green)',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <Printer size={15} />
                    <span>พิมพ์รายชื่อ ({selectedAppIds.size})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePrintApplications('selected')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      borderRadius: '7px',
                      background: '#ffffff',
                      color: 'var(--math-green)',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.84rem',
                      cursor: 'pointer',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <FileText size={15} />
                    <span>พิมพ์ใบสมัคร ({selectedAppIds.size})</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleToggleSelectAll}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '7px',
                      background: 'rgba(255, 255, 255, 0.18)',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.35)',
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    {selectedAppIds.size === filteredApps.length ? 'ยกเลิกทั้งหมด' : `เลือกทั้งหมด (${filteredApps.length})`}
                  </button>

                  <button
                    type="button"
                    onClick={handleClearSelection}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 10px',
                      borderRadius: '7px',
                      background: 'transparent',
                      color: '#fed7aa',
                      border: 'none',
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                    title="ล้างการเลือกทั้งหมด"
                  >
                    <X size={15} />
                    <span>ล้าง</span>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 4px', fontSize: '0.78rem', color: '#64748b' }}>
                <span>💡 คลิกกล่องเลือกด้านหน้า หรือคลิกที่แถวเมื่ออยู่ในโหมดเลือก เพื่อสั่งพิมพ์รายงานทีละหลายคน</span>
              </div>
            )}

            {/* Applications Table */}
            <div className="table-responsive" style={{ background: 'var(--surface-card)', borderRadius: '12px', border: '1px solid var(--border-light, #e2e8f0)', overflow: 'hidden' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-ground, #f8fafc)', borderBottom: '1px solid var(--border-light, #e2e8f0)' }}>
                    <th style={{ width: 44, padding: '12px 14px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={filteredApps.length > 0 && selectedAppIds.size === filteredApps.length}
                        onChange={handleToggleSelectAll}
                        style={{ cursor: 'pointer', width: 16, height: 16, accentColor: 'var(--math-green, #077b38)' }}
                        title="เลือกทั้งหมด / ยกเลิกทั้งหมด"
                      />
                    </th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>ผู้สมัคร</th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>สาขา / ชั้นปี</th>
                    <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>ทุนที่สมัคร</th>
                    <th style={{ padding: '12px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>GPAX</th>
                    <th style={{ padding: '12px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>วันที่ยื่น</th>
                    <th style={{ padding: '12px 18px', textAlign: 'center', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>สถานะ</th>
                    <th style={{ padding: '12px 18px', textAlign: 'right', fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)' }}>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApps.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        ไม่พบข้อมูลใบสมัครที่ตรงกับเงื่อนไขการค้นหา
                      </td>
                    </tr>
                  ) : (
                    filteredApps.map((app) => {
                      const isSelected = selectedAppIds.has(app.trackingId);

                      return (
                        <tr 
                          key={app.trackingId}
                          onClick={() => handleRowClick(app)}
                          style={{ 
                            borderBottom: '1px solid var(--border-light, #f1f5f9)', 
                            transition: 'all 0.15s ease',
                            background: isSelected ? 'rgba(7, 123, 56, 0.08)' : 'transparent',
                            cursor: (isSelectionMode || selectedAppIds.size > 0) ? 'pointer' : 'default'
                          }}
                        >
                          <td 
                            style={{ width: 44, padding: '14px 14px', textAlign: 'center' }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleApp(app.trackingId)}
                              style={{ cursor: 'pointer', width: 16, height: 16, accentColor: 'var(--math-green, #077b38)' }}
                              title={isSelected ? 'ยกเลิกการเลือก' : 'เลือกรายชื่อนี้'}
                            />
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--navy-900)' }}>{app.fullName}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{app.studentId}</div>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--navy-900)' }}>
                              {formatMajorAbbr(app.major)}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{app.year}</div>
                          </td>
                          <td style={{ padding: '14px 18px' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--navy-900)' }}>
                              {app.scholarshipName}
                            </span>
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'center', fontWeight: 600, color: 'var(--navy-800)' }}>
                            {app.gpax.toFixed(2)}
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {formatThaiDate(app.submissionDate)}
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'center' }}>
                            {getStatusBadge(app.status)}
                          </td>
                          <td 
                            style={{ padding: '14px 18px', textAlign: 'right' }}
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onTouchStart={(e) => e.stopPropagation()}
                          >
                            <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', justifyContent: 'flex-end' }}>
                              <button 
                                type="button"
                                onClick={() => handleOpenReview(app)}
                                style={{ 
                                  width: '32px', 
                                  height: '32px', 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  borderRadius: '6px', 
                                  border: '1px solid var(--border-light, #e2e8f0)', 
                                  background: 'var(--surface-card, #ffffff)', 
                                  color: 'var(--navy-800, #1e293b)', 
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                title="ดูข้อมูลใบสมัคร"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#f1f5f9';
                                  e.currentTarget.style.borderColor = '#cbd5e1';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'var(--surface-card, #ffffff)';
                                  e.currentTarget.style.borderColor = 'var(--border-light, #e2e8f0)';
                                }}
                              >
                                <Eye size={15} strokeWidth={1.8} />
                              </button>
                              {/* ปุ่มลบใบสมัคร */}
                              <button 
                                type="button"
                                onClick={() => {
                                  if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบใบสมัครของ "${app.fullName}" (${app.trackingId}) ออกจากระบบ?`)) {
                                    deleteApplication(app.trackingId);
                                  }
                                }}
                                style={{ 
                                  width: '32px', 
                                  height: '32px', 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center', 
                                  borderRadius: '6px', 
                                  border: '1px solid #fecaca', 
                                  background: '#fef2f2', 
                                  color: '#dc2626', 
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease'
                                }}
                                title="ลบใบสมัคร"
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = '#fee2e2';
                                  e.currentTarget.style.borderColor = '#fca5a5';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = '#fef2f2';
                                  e.currentTarget.style.borderColor = '#fecaca';
                                }}
                              >
                                <Trash2 size={14} strokeWidth={1.8} />
                              </button>

                              {/* ปุ่มอนุมัติทุนทันที (ย้ายมาไว้ขวา เมื่อยังไม่อนุมัติ) */}
                              {app.status !== 'approved' && (
                                <button 
                                  type="button"
                                  onClick={() => quickApprove(app.trackingId)}
                                  style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    borderRadius: '6px', 
                                    border: '1px solid var(--math-green, #077b38)', 
                                    background: 'var(--math-green, #077b38)', 
                                    color: '#ffffff', 
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  title="อนุมัติทุนทันที"
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#05622d';
                                    e.currentTarget.style.borderColor = '#05622d';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'var(--math-green, #077b38)';
                                    e.currentTarget.style.borderColor = 'var(--math-green, #077b38)';
                                  }}
                                >
                                  <Check size={15} strokeWidth={2.2} />
                                </button>
                              )}

                              {/* ปุ่มย้อนกลับ (ขวาสุด - แสดงเฉพาะเมื่อสถานะเป็นอนุมัติทุนแล้ว) */}
                              {app.status === 'approved' && (
                                <button 
                                  type="button"
                                  onClick={() => handleRevertStatus(app.trackingId)}
                                  style={{ 
                                    width: '32px', 
                                    height: '32px', 
                                    display: 'inline-flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    borderRadius: '6px', 
                                    border: '1px solid #fed7aa', 
                                    background: '#fff7ed', 
                                    color: '#ea580c', 
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  title="ย้อนกลับสถานะเป็นรอพิจารณา"
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#ffedd5';
                                    e.currentTarget.style.borderColor = '#fb923c';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = '#fff7ed';
                                    e.currentTarget.style.borderColor = '#fed7aa';
                                  }}
                                >
                                  <RotateCcw size={14} strokeWidth={2} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: SCHOLARSHIPS CMS */}
        {activeTab === 'scholarships' && (() => {
          const internalSchs = scholarships.filter(s => s.scope === 'internal');
          const externalSchs = scholarships.filter(s => s.scope === 'external');

          const renderSchCard = (sch: Scholarship) => {
            let statusBg = '#DCFCE7';
            let statusColor = '#166534';
            let statusText = 'เปิดรับสมัคร';
            if (sch.status === 'closing_soon') {
              statusBg = '#FEF3C7';
              statusColor = '#B45309';
              statusText = 'ใกล้ปิดรับ';
            } else if (sch.status === 'closed') {
              statusBg = '#F1F5F9';
              statusColor = '#64748B';
              statusText = 'ปิดรับแล้ว';
            }

            return (
              <div 
                key={sch.id}
                className="admin-sch-box"
                style={{
                  background: 'var(--surface-card)',
                  borderRadius: '16px',
                  border: '1px solid var(--border-light)',
                  boxShadow: 'var(--shadow-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
              >
                {/* Top Accent Strip */}
                <div style={{
                  height: 5,
                  background: sch.scope === 'internal' 
                    ? 'var(--math-green)' 
                    : 'var(--kmutnb-orange)'
                }} />

                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  {/* Header Badges */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      background: sch.scope === 'internal' ? 'var(--math-green-soft)' : 'var(--kmutnb-orange-glow)', 
                      color: sch.scope === 'internal' ? 'var(--math-green)' : 'var(--kmutnb-orange)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontWeight: 600
                    }}>
                      {sch.scope === 'internal' ? 'ทุนภายในภาควิชา' : 'ทุนภายนอก/เครือข่าย'}
                    </span>

                    <span style={{
                      fontSize: '0.72rem',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      background: statusBg,
                      color: statusColor
                    }}>
                      {statusText}
                    </span>
                  </div>

                  {/* Title */}
                  <h4 style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '1.05rem', 
                    fontWeight: 700, 
                    color: 'var(--navy-900)',
                    lineHeight: 1.4,
                    minHeight: '2.8rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {sch.title}
                  </h4>

                  {/* Description */}
                  <p style={{ 
                    margin: '0 0 16px 0', 
                    fontSize: '0.85rem', 
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    minHeight: '2.5rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {sch.description}
                  </p>

                  {/* Details Info Box */}
                  <div style={{
                    background: 'var(--surface-ground)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    marginBottom: 16,
                    border: '1px solid var(--border-light)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>มูลค่าทุน:</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--kmutnb-orange-dark, #c2410c)' }}>
                        {sch.amount}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>จำนวนโควตา:</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                        {sch.totalSlots} ทุน (เหลือ {sch.remainingSlots})
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>ปิดรับสมัคร:</span>
                      <span style={{ fontSize: '0.82rem', color: 'var(--navy-700)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <Calendar size={13} strokeWidth={1.8} style={{ color: 'var(--text-muted)' }} />
                        {sch.deadline}
                      </span>
                    </div>
                  </div>

                  {/* Actions at bottom */}
                  <div style={{ 
                    display: 'flex', 
                    gap: 8, 
                    marginTop: 'auto', 
                    paddingTop: 12, 
                    borderTop: '1px solid var(--border-light)' 
                  }}>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleOpenEditSch(sch)}
                      style={{ flex: 1, padding: '7px 0', fontSize: '0.82rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}
                    >
                      <Pencil size={13} /> แก้ไข
                    </button>
                    <button 
                      className="btn btn-sm"
                      onClick={() => handleDeleteSch(sch.id, sch.title)}
                      style={{ 
                        padding: '7px 12px', 
                        fontSize: '0.82rem', 
                        color: '#dc2626', 
                        borderColor: '#fca5a5', 
                        background: 'var(--danger-bg)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5
                      }}
                      title="ลบทุนนี้"
                    >
                      <Trash2 size={13} /> ลบ
                    </button>
                  </div>
                </div>
              </div>
            );
          };

          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--navy-900)', fontWeight: 700 }}>
                    รายการประกาศทุนการศึกษาทั้งหมด ({scholarships.length} ทุน)
                  </h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                    จำแนกออกเป็น 2 ส่วนชัดเจน: ทุนการศึกษาภายใน และ ทุนการศึกษาภายนอก
                  </p>
                </div>

                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleOpenNewSch}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px' }}
                >
                  <span>+</span> เพิ่มประกาศทุนใหม่
                </button>
              </div>

              {/* 2 Layers of Scholarships like Main Page */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                {/* ส่วนที่ 1: ทุนการศึกษาภายใน (Internal Scholarships) */}
                <div className="scope-block internal">
                  <div className="scope-block-header">
                    <div className="scope-block-title-area">
                      <span className="scope-block-badge internal">🏛️ ทุนภายใน</span>
                      <h3 className="scope-block-title">
                        ส่วนที่ 1: ทุนการศึกษาภายใน ({internalSchs.length} ทุน)
                      </h3>
                      <p className="scope-block-desc">
                        ทุนสนับสนุนโดยตรงจากมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (มจพ.), คณะวิทยาศาสตร์ประยุกต์ และกองทุนพัฒนาภาควิชาคณิตศาสตร์
                      </p>
                    </div>

                    <div className="scope-block-stat internal">
                      <span className="scope-block-stat-num">{internalSchs.length}</span>
                      <span className="scope-block-stat-label">ทุนภายใน</span>
                    </div>
                  </div>

                  <div className="admin-cards-grid">
                    {internalSchs.length > 0 ? (
                      internalSchs.map(sch => renderSchCard(sch))
                    ) : (
                      <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface-ground)', borderRadius: '12px' }}>
                        ยังไม่มีประกาศทุนภายใน
                      </div>
                    )}
                  </div>
                </div>

                {/* ส่วนที่ 2: ทุนการศึกษาภายนอก (External Scholarships) */}
                <div className="scope-block external">
                  <div className="scope-block-header">
                    <div className="scope-block-title-area">
                      <span className="scope-block-badge external">🌐 ทุนภายนอก</span>
                      <h3 className="scope-block-title">
                        ส่วนที่ 2: ทุนการศึกษาภายนอก ({externalSchs.length} ทุน)
                      </h3>
                      <p className="scope-block-desc">
                        ทุนสนับสนุนจากหน่วยงานภายนอก มูลนิธิเพื่อการศึกษา องค์กรพันธมิตรภาคอุตสาหกรรม และชมรมศิษย์เก่าภาควิชาคณิตศาสตร์ มจพ.
                      </p>
                    </div>

                    <div className="scope-block-stat external">
                      <span className="scope-block-stat-num">{externalSchs.length}</span>
                      <span className="scope-block-stat-label">ทุนภายนอก</span>
                    </div>
                  </div>

                  <div className="admin-cards-grid">
                    {externalSchs.length > 0 ? (
                      externalSchs.map(sch => renderSchCard(sch))
                    ) : (
                      <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--surface-ground)', borderRadius: '12px' }}>
                        ยังไม่มีประกาศทุนภายนอก
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* TAB 3: NEWS & ANNOUNCEMENTS CMS */}
        {activeTab === 'news' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--navy-900)', fontWeight: 700 }}>
                  ข่าวสารและประกาศ ({announcements.length} รายการ)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                  จัดการข่าวสาร ประกาศผล และการแจ้งเตือนต่างๆ
                </p>
              </div>

              <button 
                className="btn btn-primary btn-sm"
                onClick={handleOpenNewAnn}
                style={{ display: 'flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px' }}
              >
                <span>+</span> เพิ่มประกาศ
              </button>
            </div>
            
            <div className="admin-cards-grid">
                {announcements.map((ann) => {
                  let badgeBg = 'var(--math-green-soft, #dcfce7)';
                  let badgeColor = 'var(--math-green-dark, #166534)';
                  let badgeBorder = 'var(--math-green-border, #bbf7d0)';

                  if (ann.tagType === 'warning') {
                    badgeBg = 'var(--warning-bg, #fef3c7)';
                    badgeColor = 'var(--warning, #b45309)';
                    badgeBorder = 'var(--warning-border, #fde68a)';
                  } else if (ann.tag === 'ทุนนวัตกรรม') {
                    badgeBg = 'rgba(232,78,15,0.1)';
                    badgeColor = 'var(--kmutnb-orange, #e65100)';
                    badgeBorder = 'rgba(232,78,15,0.25)';
                  }

                  return (
                    <div
                      key={ann.id}
                      className="admin-ann-box"
                      style={{
                        background: 'var(--surface-card)',
                        borderRadius: '16px',
                        border: '1px solid var(--border-light)',
                        boxShadow: 'var(--shadow-xs)',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      {/* Top Accent Strip */}
                      <div style={{
                        height: 5,
                        background: ann.tagType === 'warning' ? 'var(--warning, #f59e0b)' : 'var(--math-green, #10b981)'
                      }} />

                      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                        {/* Header: Tag + Date */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                          <span style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 'var(--radius-full, 9999px)',
                            background: badgeBg,
                            color: badgeColor,
                            border: `1px solid ${badgeBorder}`
                          }}>
                            {ann.tag}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                            <Calendar size={13} strokeWidth={1.8} style={{ color: 'var(--text-muted)' }} />
                            {ann.date}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 style={{ 
                          margin: '0 0 10px 0', 
                          fontSize: '1.05rem', 
                          fontWeight: 700, 
                          color: 'var(--navy-900)',
                          lineHeight: 1.45,
                          minHeight: '3.1rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {ann.title}
                        </h4>

                        {/* Summary */}
                        <p style={{ 
                          margin: '0 0 16px 0', 
                          fontSize: '0.86rem', 
                          color: 'var(--navy-600)',
                          lineHeight: 1.6,
                          flex: 1,
                          display: '-webkit-box',
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          minHeight: '4.1rem'
                        }}>
                          {ann.summary}
                        </p>

                        {/* Actions at bottom */}
                        <div style={{ 
                          display: 'flex', 
                          gap: 8, 
                          marginTop: 'auto', 
                          paddingTop: 12, 
                          borderTop: '1px solid var(--border-light)' 
                        }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleOpenEditAnn(ann)}
                            style={{ flex: 1, padding: '7px 0', fontSize: '0.82rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5 }}
                          >
                            <Pencil size={13} /> แก้ไข
                          </button>
                          <button 
                            className="btn btn-sm"
                            onClick={() => handleDeleteAnn(ann.id, ann.title)}
                            style={{ 
                              padding: '7px 12px', 
                              fontSize: '0.82rem', 
                              color: '#dc2626', 
                              borderColor: '#fca5a5', 
                              background: 'var(--danger-bg)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5
                            }}
                            title="ลบประกาศนี้"
                          >
                            <Trash2 size={13} /> ลบ
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
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
                <Plus size={15} strokeWidth={2} />
                <span>เพิ่มคำถาม-คำตอบ</span>
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
                    <div style={{ fontWeight: 600, color: 'var(--navy-900)', fontSize: '0.95rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HelpCircle size={16} strokeWidth={1.8} style={{ color: 'var(--navy-600, #475569)', flexShrink: 0 }} />
                      <span>{faq.question}</span>
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
          <div style={{ 
            background: 'var(--surface-white, #ffffff)', 
            borderRadius: '16px', 
            border: '1px solid var(--border-light, #e2e8f0)',
            padding: '32px 40px', 
            width: '100%', 
            boxSizing: 'border-box',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' 
          }}>
            <div style={{ marginBottom: 32, borderBottom: '1px solid var(--border-light)', paddingBottom: 20 }}>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 600, color: 'var(--navy-900)', letterSpacing: '-0.01em' }}>
                ตั้งค่าเว็บไซต์ทั่วไป
              </h3>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-muted)' }}>
                ปรับแต่งข้อมูลหลักของเว็บไซต์ ปีการศึกษา ข้อความหัวเรื่อง และข้อมูลติดต่อ
              </p>
            </div>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Section: ข้อมูลทั่วไป */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--navy-800)', fontWeight: 600 }}>ข้อมูลทั่วไป</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                      ปีการศึกษา (Academic Year)
                    </label>
                    <input
                      type="text"
                      list="academic-years"
                      className="form-input-light"
                      value={settingsForm.academicYear}
                      onChange={(e) => setSettingsForm({ ...settingsForm, academicYear: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 16px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                        background: 'var(--surface-ground)',
                        boxSizing: 'border-box',
                        fontSize: '0.95rem'
                      }}
                    />
                    <datalist id="academic-years">
                      <option value={new Date().getFullYear() + 543 - 1} />
                      <option value={new Date().getFullYear() + 543} />
                      <option value={new Date().getFullYear() + 543 + 1} />
                    </datalist>
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                      ภาคการศึกษา (Semester)
                    </label>
                    <div style={{ position: 'relative', width: '100%' }}>
                      <select
                        className="form-input-light"
                        value={settingsForm.semester}
                        onChange={(e) => setSettingsForm({ ...settingsForm, semester: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          height: '46px',
                          padding: '0 38px 0 16px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-light)',
                          background: 'var(--surface-ground)',
                          WebkitAppearance: 'none',
                          MozAppearance: 'none',
                          appearance: 'none',
                          cursor: 'pointer',
                          boxSizing: 'border-box',
                          fontSize: '0.95rem',
                          color: 'var(--text-main)'
                        }}
                      >
                        <option value="" disabled>เลือกภาคการศึกษา</option>
                        <option value="1">1 (ภาคเรียนที่ 1)</option>
                        <option value="2">2 (ภาคเรียนที่ 2)</option>
                        <option value="3">3 (ภาคฤดูร้อน)</option>
                      </select>
                      <div style={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <ChevronDown size={18} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border-light)' }} />

              {/* Section: เนื้อหาหน้าแรก */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--navy-800)', fontWeight: 600 }}>เนื้อหาหน้าแรก</h4>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                    ข้อความพาดหัว (Hero Title)
                  </label>
                  <input
                    type="text"
                    className="form-input-light"
                    value={settingsForm.heroTitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroTitle: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      height: '46px',
                      padding: '0 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--surface-ground)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                    คำอธิบาย (Hero Subtitle)
                  </label>
                  <textarea
                    className="form-input-light"
                    rows={2}
                    value={settingsForm.heroSubtitle}
                    onChange={(e) => setSettingsForm({ ...settingsForm, heroSubtitle: e.target.value })}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--surface-ground)',
                      resize: 'none',
                      boxSizing: 'border-box',
                      lineHeight: 1.5
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                    แถบวิ่งประชาสัมพันธ์ (Marquee Ticker Text)
                  </label>
                  <input
                    type="text"
                    className="form-input-light"
                    value={settingsForm.tickerText || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tickerText: e.target.value })}
                    placeholder="เช่น เปิดรับสมัครทุนการศึกษา..."
                    style={{
                      width: '100%',
                      height: '46px',
                      padding: '0 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--surface-ground)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border-light)' }} />

              {/* Section: ข้อมูลติดต่อ */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--navy-800)', fontWeight: 600 }}>ข้อมูลติดต่อ</h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="text"
                      className="form-input-light"
                      value={settingsForm.contactPhone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contactPhone: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 16px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                        background: 'var(--surface-ground)',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                      อีเมล
                    </label>
                    <input
                      type="email"
                      className="form-input-light"
                      value={settingsForm.contactEmail}
                      onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        height: '46px',
                        padding: '0 16px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)',
                        background: 'var(--surface-ground)',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                    ที่ตั้งสำนักงาน
                  </label>
                  <input
                    type="text"
                    className="form-input-light"
                    value={settingsForm.contactAddress || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, contactAddress: e.target.value })}
                    placeholder="เช่น อาคาร 78 ชั้น 7..."
                    style={{
                      width: '100%',
                      height: '46px',
                      padding: '0 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--surface-ground)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: 6, display: 'block' }}>
                    ลิงก์ Facebook
                  </label>
                  <input
                    type="url"
                    className="form-input-light"
                    value={settingsForm.facebookUrl || ''}
                    onChange={(e) => setSettingsForm({ ...settingsForm, facebookUrl: e.target.value })}
                    placeholder="https://facebook.com/..."
                    style={{
                      width: '100%',
                      height: '46px',
                      padding: '0 16px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-light)',
                      background: 'var(--surface-ground)',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, paddingTop: 24, borderTop: '1px solid var(--border-light)' }}>
                <button type="submit" className="btn btn-primary" style={{ minWidth: 160, borderRadius: '8px', padding: '12px 24px', fontWeight: 600, boxShadow: '0 4px 14px rgba(7, 123, 56, 0.25)' }}>
                  บันทึกการตั้งค่า
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* MODAL: VIEW / EDIT APPLICATION DATA */}
      {isReviewModalOpen && selectedApp && appEditData && (
        <div className="modal-backdrop open" style={{ zIndex: 2000 }}>
          <div className="modal-card" style={{ maxWidth: 920, width: '95%', maxHeight: '92vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.18)', background: '#ffffff' }}>
            {/* Minimal Header */}
            <div style={{
              padding: '18px 24px',
              background: '#ffffff',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.18rem', color: 'var(--navy-900)', fontWeight: 700 }}>
                    {isEditMode ? 'แก้ไขข้อมูลใบสมัคร' : 'ดูข้อมูลใบสมัคร'}
                  </h3>
                  <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '6px', background: '#f1f5f9', color: '#475569', fontWeight: 600, fontFamily: 'monospace' }}>
                    #{selectedApp.trackingId}
                  </span>
                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as ApplicationStatus)}
                    style={{
                      fontSize: '0.8rem',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: reviewStatus === 'approved' ? '#86efac' : reviewStatus === 'rejected' ? '#fca5a5' : '#93c5fd',
                      background: reviewStatus === 'approved' ? '#f0fdf4' : reviewStatus === 'rejected' ? '#fef2f2' : '#eff6ff',
                      color: reviewStatus === 'approved' ? '#047857' : reviewStatus === 'rejected' ? '#b91c1c' : '#1d4ed8',
                      fontWeight: 600,
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                    title="คลิกเพื่อเปลี่ยนสถานะใบสมัคร"
                  >
                    <option value="submitted">ยื่นใบสมัครแล้ว (รอพิจารณา)</option>
                    <option value="approved">อนุมัติทุนการศึกษา</option>
                    <option value="rejected">ไม่ผ่านการพิจารณา</option>
                  </select>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 4, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>{appEditData.fullName} • รหัส {appEditData.studentId} • ทุน: {selectedApp.scholarshipName}</span>
                  {appEditData.systemRating > 0 && (
                    <span style={{ color: '#eab308', display: 'inline-flex', alignItems: 'center', gap: '2px', background: '#fffbeb', padding: '2px 8px', borderRadius: '12px', border: '1px solid #fef08a', fontSize: '0.75rem' }} title={`คะแนนความพึงพอใจ: ${appEditData.systemRating}/5`}>
                      {[...Array(5)].map((_, i) => (
                        <span key={i} style={{ color: i < appEditData.systemRating ? '#eab308' : '#cbd5e1', fontSize: '1rem', lineHeight: 1 }}>★</span>
                      ))}
                    </span>
                  )}
                </div>
                {appEditData.systemComment && (
                  <div style={{ fontSize: '0.82rem', color: '#475569', marginTop: 8, background: '#f8fafc', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <strong>ข้อเสนอแนะ:</strong> {appEditData.systemComment}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => handlePrintApplications(selectedApp.trackingId)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: 'var(--navy-800, #1e293b)'
                  }}
                  title="พิมพ์ใบสมัครนี้"
                >
                  <Printer size={14} />
                  <span>พิมพ์ใบสมัคร</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEditMode(!isEditMode)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: '8px',
                    fontSize: '0.84rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    border: isEditMode ? '1px solid var(--math-green, #077b38)' : '1px solid #cbd5e1',
                    background: isEditMode ? '#f0fdf4' : '#ffffff',
                    color: isEditMode ? 'var(--math-green, #077b38)' : 'var(--navy-800, #1e293b)'
                  }}
                  title={isEditMode ? 'สลับเป็นโหมดดูข้อมูล' : 'แก้ไขข้อมูลใบสมัคร'}
                >
                  <Pencil size={14} />
                  <span>{isEditMode ? 'กำลังแก้ไข' : 'แก้ไข'}</span>
                </button>

                <button 
                  type="button"
                  className="modal-close-btn" 
                  onClick={() => setIsReviewModalOpen(false)}
                  style={{ fontSize: '1.4rem', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', lineHeight: 1 }}
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Minimal Step Navigation Tabs */}
            <div style={{
              display: 'flex',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              overflowX: 'auto',
              padding: '0 20px'
            }}>
              {[
                { id: 1, label: '1. ข้อมูลส่วนตัว & การศึกษา' },
                { id: 2, label: '2. ข้อมูลครอบครัว & การกู้ยืม' },
                { id: 3, label: '3. กิจกรรม & เหตุผลความจำเป็น' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAppModalTab(tab.id)}
                  style={{
                    padding: '11px 18px',
                    border: 'none',
                    borderBottom: appModalTab === tab.id ? '2.5px solid var(--math-green, #077b38)' : '2.5px solid transparent',
                    background: 'transparent',
                    color: appModalTab === tab.id ? 'var(--math-green, #077b38)' : '#64748b',
                    fontWeight: appModalTab === tab.id ? 700 : 500,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Form Body */}
            <form onSubmit={handleSaveReview} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <fieldset disabled={!isEditMode} style={{ border: 'none', padding: 0, margin: 0, display: 'contents' }}>
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* TAB 1: ข้อมูลส่วนตัวและการศึกษา */}
                  {appModalTab === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        {/* Photo Box */}
                        <div style={{ width: 140, textAlign: 'center' }}>
                          <div style={{
                            width: 140,
                            height: 170,
                            borderRadius: '12px',
                            border: isEditMode ? '2px dashed #cbd5e1' : '1px solid #e2e8f0',
                            background: '#f8fafc',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                          }}>
                            {appProfilePhoto ? (
                              <img src={appProfilePhoto} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>ไม่มีรูปถ่าย</div>
                            )}
                          </div>
                          {isEditMode && (
                            <>
                              <label style={{
                                display: 'inline-block',
                                marginTop: 8,
                                padding: '4px 10px',
                                background: '#e2e8f0',
                                color: '#334155',
                                borderRadius: '6px',
                                fontSize: '0.76rem',
                                cursor: 'pointer',
                                fontWeight: 600
                              }}>
                                เปลี่ยนรูป
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => setAppProfilePhoto(reader.result as string);
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                              {appProfilePhoto && (
                                <button
                                  type="button"
                                  onClick={() => setAppProfilePhoto(null)}
                                  style={{ display: 'block', margin: '4px auto 0', background: 'none', border: 'none', color: '#dc2626', fontSize: '0.72rem', cursor: 'pointer' }}
                                >
                                  ลบรูป
                                </button>
                              )}
                            </>
                          )}
                        </div>

                      {/* Top Form Fields */}
                      <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                            ทุนการศึกษาที่สมัคร *
                          </label>
                          <select
                            className="form-input-light"
                            value={appEditData.scholarshipId}
                            onChange={(e) => setAppEditData({ ...appEditData, scholarshipId: e.target.value })}
                            required
                          >
                            {scholarships.map(s => (
                              <option key={s.id} value={s.id}>{s.title} ({s.amount})</option>
                            ))}
                          </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                              ชื่อ-นามสกุล (พร้อมคำนำหน้า) *
                            </label>
                            <input
                              type="text"
                              className="form-input-light"
                              value={appEditData.fullName}
                              onChange={(e) => setAppEditData({ ...appEditData, fullName: e.target.value })}
                              required
                            />
                          </div>

                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                              รหัสนักศึกษา (13 หลัก) *
                            </label>
                            <input
                              type="text"
                              className="form-input-light"
                              value={appEditData.studentId}
                              maxLength={13}
                              onChange={(e) => setAppEditData({ ...appEditData, studentId: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Student Info Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                          ชื่อเล่น
                        </label>
                        <input
                          type="text"
                          className="form-input-light"
                          value={appEditData.nickname || ''}
                          onChange={(e) => setAppEditData({ ...appEditData, nickname: e.target.value })}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                          เบอร์โทรศัพท์ติดต่อ *
                        </label>
                        <input
                          type="tel"
                          className="form-input-light"
                          value={appEditData.phone}
                          onChange={(e) => setAppEditData({ ...appEditData, phone: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                          สาขาวิชา *
                        </label>
                        <select
                          className="form-input-light"
                          value={appEditData.major}
                          onChange={(e) => setAppEditData({ ...appEditData, major: e.target.value })}
                          required
                        >
                          <option value="MA โครงการปกติ">MA โครงการปกติ</option>
                          <option value="MA โครงการสมทบ">MA โครงการสมทบ</option>
                          <option value="MC โครงการปกติ">MC โครงการปกติ</option>
                          <option value="MC โครงการสมทบ">MC โครงการสมทบ</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                          ระดับชั้นปี *
                        </label>
                        <select
                          className="form-input-light"
                          value={appEditData.year}
                          onChange={(e) => setAppEditData({ ...appEditData, year: e.target.value })}
                          required
                        >
                          <option value="ปี 1">ชั้นปีที่ 1</option>
                          <option value="ปี 2">ชั้นปีที่ 2</option>
                          <option value="ปี 3">ชั้นปีที่ 3</option>
                          <option value="ปี 4">ชั้นปีที่ 4</option>
                          <option value="บัณฑิตศึกษา">บัณฑิตศึกษา</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                          เกรดเฉลี่ยสะสม (GPAX) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="4"
                          className="form-input-light"
                          value={appEditData.gpax}
                          onChange={(e) => setAppEditData({ ...appEditData, gpax: parseFloat(e.target.value) || 0 })}
                          required
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                          อีเมลมหาวิทยาลัย *
                        </label>
                        <input
                          type="email"
                          className="form-input-light"
                          value={appEditData.email}
                          onChange={(e) => setAppEditData({ ...appEditData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {/* Address Section */}
                    <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0', marginTop: 10 }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', color: 'var(--navy-900)' }}>
                        ที่อยู่ตามบัตรประจำตัวประชาชน *
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>บ้านเลขที่ *</label>
                          <input
                            type="text"
                            className="form-input-light"
                            value={appEditData.idCardAddress.houseNo}
                            onChange={(e) => setAppEditData({
                              ...appEditData,
                              idCardAddress: { ...appEditData.idCardAddress, houseNo: e.target.value },
                              ...(appEditData.isIdCardAddress ? { address: { ...appEditData.address, houseNo: e.target.value } } : {})
                            })}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>หมู่</label>
                          <input
                            type="text"
                            className="form-input-light"
                            value={appEditData.idCardAddress.moo}
                            onChange={(e) => setAppEditData({
                              ...appEditData,
                              idCardAddress: { ...appEditData.idCardAddress, moo: e.target.value },
                              ...(appEditData.isIdCardAddress ? { address: { ...appEditData.address, moo: e.target.value } } : {})
                            })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>ซอย</label>
                          <input
                            type="text"
                            className="form-input-light"
                            value={appEditData.idCardAddress.soi}
                            onChange={(e) => setAppEditData({
                              ...appEditData,
                              idCardAddress: { ...appEditData.idCardAddress, soi: e.target.value },
                              ...(appEditData.isIdCardAddress ? { address: { ...appEditData.address, soi: e.target.value } } : {})
                            })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>ถนน</label>
                          <input
                            type="text"
                            className="form-input-light"
                            value={appEditData.idCardAddress.road}
                            onChange={(e) => setAppEditData({
                              ...appEditData,
                              idCardAddress: { ...appEditData.idCardAddress, road: e.target.value },
                              ...(appEditData.isIdCardAddress ? { address: { ...appEditData.address, road: e.target.value } } : {})
                            })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>ตำบล/แขวง *</label>
                          <input
                            type="text"
                            className="form-input-light"
                            value={appEditData.idCardAddress.subDistrict}
                            onChange={(e) => setAppEditData({
                              ...appEditData,
                              idCardAddress: { ...appEditData.idCardAddress, subDistrict: e.target.value },
                              ...(appEditData.isIdCardAddress ? { address: { ...appEditData.address, subDistrict: e.target.value } } : {})
                            })}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>อำเภอ/เขต *</label>
                          <input
                            type="text"
                            className="form-input-light"
                            value={appEditData.idCardAddress.district}
                            onChange={(e) => setAppEditData({
                              ...appEditData,
                              idCardAddress: { ...appEditData.idCardAddress, district: e.target.value },
                              ...(appEditData.isIdCardAddress ? { address: { ...appEditData.address, district: e.target.value } } : {})
                            })}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>จังหวัด *</label>
                          <select
                            className="form-input-light"
                            value={appEditData.idCardAddress.province}
                            onChange={(e) => setAppEditData({
                              ...appEditData,
                              idCardAddress: { ...appEditData.idCardAddress, province: e.target.value },
                              ...(appEditData.isIdCardAddress ? { address: { ...appEditData.address, province: e.target.value } } : {})
                            })}
                            required
                          >
                            {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>รหัสไปรษณีย์ *</label>
                          <input
                            type="text"
                            className="form-input-light"
                            value={appEditData.idCardAddress.zipCode}
                            onChange={(e) => setAppEditData({
                              ...appEditData,
                              idCardAddress: { ...appEditData.idCardAddress, zipCode: e.target.value },
                              ...(appEditData.isIdCardAddress ? { address: { ...appEditData.address, zipCode: e.target.value } } : {})
                            })}
                            required
                          />
                        </div>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={appEditData.isIdCardAddress}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              setAppEditData({
                                ...appEditData,
                                isIdCardAddress: isChecked,
                                address: isChecked ? { ...appEditData.idCardAddress } : { ...appEditData.address }
                              });
                            }}
                          />
                          <span>ที่อยู่ปัจจุบันตรงกับที่อยู่ตามบัตรประชาชน</span>
                        </label>
                      </div>

                      {!appEditData.isIdCardAddress && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px dashed #cbd5e1' }}>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', color: 'var(--navy-900)' }}>
                            ที่อยู่ปัจจุบัน *
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px' }}>
                            <div>
                              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>บ้านเลขที่ *</label>
                              <input
                                type="text"
                                className="form-input-light"
                                value={appEditData.address.houseNo}
                                onChange={(e) => setAppEditData({ ...appEditData, address: { ...appEditData.address, houseNo: e.target.value } })}
                                required
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>หมู่</label>
                              <input
                                type="text"
                                className="form-input-light"
                                value={appEditData.address.moo}
                                onChange={(e) => setAppEditData({ ...appEditData, address: { ...appEditData.address, moo: e.target.value } })}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>ซอย</label>
                              <input
                                type="text"
                                className="form-input-light"
                                value={appEditData.address.soi}
                                onChange={(e) => setAppEditData({ ...appEditData, address: { ...appEditData.address, soi: e.target.value } })}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>ถนน</label>
                              <input
                                type="text"
                                className="form-input-light"
                                value={appEditData.address.road}
                                onChange={(e) => setAppEditData({ ...appEditData, address: { ...appEditData.address, road: e.target.value } })}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>ตำบล/แขวง *</label>
                              <input
                                type="text"
                                className="form-input-light"
                                value={appEditData.address.subDistrict}
                                onChange={(e) => setAppEditData({ ...appEditData, address: { ...appEditData.address, subDistrict: e.target.value } })}
                                required
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>อำเภอ/เขต *</label>
                              <input
                                type="text"
                                className="form-input-light"
                                value={appEditData.address.district}
                                onChange={(e) => setAppEditData({ ...appEditData, address: { ...appEditData.address, district: e.target.value } })}
                                required
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>จังหวัด *</label>
                              <select
                                className="form-input-light"
                                value={appEditData.address.province}
                                onChange={(e) => setAppEditData({ ...appEditData, address: { ...appEditData.address, province: e.target.value } })}
                                required
                              >
                                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>รหัสไปรษณีย์ *</label>
                              <input
                                type="text"
                                className="form-input-light"
                                value={appEditData.address.zipCode}
                                onChange={(e) => setAppEditData({ ...appEditData, address: { ...appEditData.address, zipCode: e.target.value } })}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: ข้อมูลครอบครัว & การกู้ยืม */}
                {appModalTab === 2 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Father Info */}
                    <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', color: 'var(--navy-900)' }}>
                        ข้อมูลบิดา
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>ชื่อ-นามสกุลบิดา</label>
                          <input
                            type="text"
                            className="form-input-light"
                            value={appEditData.fatherName}
                            onChange={(e) => setAppEditData({ ...appEditData, fatherName: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>เบอร์โทรศัพท์บิดา</label>
                          <input
                            type="tel"
                            className="form-input-light"
                            value={appEditData.fatherPhone}
                            onChange={(e) => setAppEditData({ ...appEditData, fatherPhone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>อาชีพบิดา</label>
                          <input
                            type="text"
                            className="form-input-light"
                            value={appEditData.fatherJob}
                            onChange={(e) => setAppEditData({ ...appEditData, fatherJob: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>รายได้บิดา (บาท/เดือน)</label>
                          <input
                            type="number"
                            className="form-input-light"
                            value={appEditData.fatherIncome}
                            onChange={(e) => setAppEditData({ ...appEditData, fatherIncome: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>สถานะการมีชีวิต</label>
                          <select
                            className="form-input-light"
                            value={appEditData.fatherAlive}
                            onChange={(e) => setAppEditData({ ...appEditData, fatherAlive: e.target.value as 'alive' | 'deceased' })}
                          >
                            <option value="alive">ยังมีชีวิตอยู่</option>
                            <option value="deceased">ถึงแก่กรรม</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Mother Info */}
                    <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.92rem', color: 'var(--navy-900)' }}>
                        ข้อมูลมารดา
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>ชื่อ-นามสกุลมารดา</label>
                          <input
                            type="text"
                            className="form-input-light"
                            value={appEditData.motherName}
                            onChange={(e) => setAppEditData({ ...appEditData, motherName: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>เบอร์โทรศัพท์มารดา</label>
                          <input
                            type="tel"
                            className="form-input-light"
                            value={appEditData.motherPhone}
                            onChange={(e) => setAppEditData({ ...appEditData, motherPhone: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>อาชีพมารดา</label>
                          <input
                            type="text"
                            className="form-input-light"
                            value={appEditData.motherJob}
                            onChange={(e) => setAppEditData({ ...appEditData, motherJob: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>รายได้มารดา (บาท/เดือน)</label>
                          <input
                            type="number"
                            className="form-input-light"
                            value={appEditData.motherIncome}
                            onChange={(e) => setAppEditData({ ...appEditData, motherIncome: Number(e.target.value) || 0 })}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>สถานะการมีชีวิต</label>
                          <select
                            className="form-input-light"
                            value={appEditData.motherAlive}
                            onChange={(e) => setAppEditData({ ...appEditData, motherAlive: e.target.value as 'alive' | 'deceased' })}
                          >
                            <option value="alive">ยังมีชีวิตอยู่</option>
                            <option value="deceased">ถึงแก่กรรม</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Family Status & Income */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                          สถานภาพของบิดามารดา
                        </label>
                        <select
                          className="form-input-light"
                          value={appEditData.parentsRelation}
                          onChange={(e) => setAppEditData({ ...appEditData, parentsRelation: e.target.value as 'together' | 'divorced' | 'other' })}
                        >
                          <option value="together">บิดามารดาอยู่ด้วยกัน</option>
                          <option value="divorced">หย่าร้าง / แยกกันอยู่</option>
                          <option value="other">บิดาหรือมารดาถึงแก่กรรม / อื่นๆ</option>
                        </select>
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                          รายได้ครอบครัวรวม (บาท/ปี)
                        </label>
                        <input
                          type="number"
                          className="form-input-light"
                          value={appEditData.familyIncome}
                          onChange={(e) => setAppEditData({ ...appEditData, familyIncome: Number(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                          จำนวนพี่น้องร่วมบิดามารดา (คน)
                        </label>
                        <input
                          type="number"
                          className="form-input-light"
                          value={appEditData.siblings}
                          onChange={(e) => setAppEditData({ ...appEditData, siblings: Number(e.target.value) || 0 })}
                        />
                      </div>
                    </div>

                    {/* Sponsor & Loan */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                          การกู้ยืมเงินเพื่อการศึกษา
                        </label>
                        <select
                          className="form-input-light"
                          value={appEditData.loanStatus}
                          onChange={(e) => setAppEditData({ ...appEditData, loanStatus: e.target.value as 'none' | 'กยศ' })}
                        >
                          <option value="none">ไม่ได้กู้ยืมเงิน</option>
                          <option value="กยศ">กู้ยืมกองทุน กยศ.</option>
                        </select>
                      </div>

                      {appEditData.loanStatus !== 'none' && (
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy-800)', marginBottom: 4, display: 'block' }}>
                            จำนวนเงินที่กู้ยืม (บาท/ภาคเรียน)
                          </label>
                          <input
                            type="number"
                            className="form-input-light"
                            value={appEditData.loanAmount}
                            onChange={(e) => setAppEditData({ ...appEditData, loanAmount: Number(e.target.value) || 0 })}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: กิจกรรม & เหตุผลความจำเป็น */}
                {appModalTab === 3 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {/* Part-time & Volunteer */}
                    <div style={{ background: '#f8fafc', padding: 18, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <input
                          type="checkbox"
                          id="partTimeCheck"
                          checked={appEditData.hasPartTimeJob}
                          onChange={(e) => setAppEditData({ ...appEditData, hasPartTimeJob: e.target.checked })}
                        />
                        <label htmlFor="partTimeCheck" style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--navy-800)', cursor: 'pointer' }}>
                          มีการทำงานพิเศษ / งานพาร์ทไทม์ (Part-time)
                        </label>
                      </div>

                      {appEditData.hasPartTimeJob && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                          <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>อาชีพงานพิเศษ</label>
                            <input
                              type="text"
                              className="form-input-light"
                              value={appEditData.partTimeJobLocation}
                              onChange={(e) => setAppEditData({ ...appEditData, partTimeJobLocation: e.target.value })}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>รายได้พิเศษ (บาท/เดือน)</label>
                            <input
                              type="number"
                              className="form-input-light"
                              value={appEditData.partTimeJobIncome}
                              onChange={(e) => setAppEditData({ ...appEditData, partTimeJobIncome: Number(e.target.value) || 0 })}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Activities List (Add / Edit / Delete) */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                          ประวัติกิจกรรมที่เคยเข้าร่วม (Activity List)
                        </label>
                        {isEditMode && (
                          <button
                            type="button"
                            onClick={() => {
                              const current = appEditData.activityList || [];
                              setAppEditData({
                                ...appEditData,
                                activityList: [...current, { name: '', role: '', photoBase64: null }]
                              });
                            }}
                            style={{
                              padding: '4px 12px',
                              borderRadius: '6px',
                              border: '1px solid var(--math-green, #077b38)',
                              background: '#f0fdf4',
                              color: 'var(--math-green)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Plus size={14} />
                            <span>เพิ่มกิจกรรม</span>
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(!appEditData.activityList || appEditData.activityList.length === 0) ? (
                          <div style={{ padding: 14, textAlign: 'center', background: '#f8fafc', borderRadius: 8, color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                            {isEditMode ? 'ยังไม่มีข้อมูลกิจกรรม (กดปุ่ม "+ เพิ่มกิจกรรม" เพื่อเพิ่มรายการ)' : 'ไม่มีข้อมูลกิจกรรม'}
                          </div>
                        ) : (
                          appEditData.activityList.map((act, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', width: 20 }}>
                                {idx + 1}.
                              </span>
                              <div style={{ flex: 2 }}>
                                <input
                                  type="text"
                                  className="form-input-light"
                                  placeholder="ชื่อกิจกรรม เช่น ค่ายคณิตศาสตร์สัญจร"
                                  value={act.name}
                                  onChange={(e) => {
                                    const next = [...(appEditData.activityList || [])];
                                    next[idx].name = e.target.value;
                                    setAppEditData({ ...appEditData, activityList: next });
                                  }}
                                />
                              </div>
                              <div style={{ flex: 1 }}>
                                <input
                                  type="text"
                                  className="form-input-light"
                                  placeholder="บทบาทหน้าที่ เช่น สวัสดิการ"
                                  value={act.role}
                                  onChange={(e) => {
                                    const next = [...(appEditData.activityList || [])];
                                    next[idx].role = e.target.value;
                                    setAppEditData({ ...appEditData, activityList: next });
                                  }}
                                />
                              </div>
                              {isEditMode && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = (appEditData.activityList || []).filter((_, i) => i !== idx);
                                    setAppEditData({ ...appEditData, activityList: next });
                                  }}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    border: '1px solid #fca5a5',
                                    background: '#fef2f2',
                                    color: '#dc2626',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="ลบกิจกรรมนี้"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Reasons List (Add / Edit / Delete) */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--navy-900)' }}>
                          เหตุผลความจำเป็นในการขอรับทุนการศึกษา
                        </label>
                        {isEditMode && (
                          <button
                            type="button"
                            onClick={() => {
                              const current = appEditData.reasonsList || [];
                              setAppEditData({
                                ...appEditData,
                                reasonsList: [...current, '']
                              });
                            }}
                            style={{
                              padding: '4px 12px',
                              borderRadius: '6px',
                              border: '1px solid var(--math-green, #077b38)',
                              background: '#f0fdf4',
                              color: 'var(--math-green)',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                          >
                            <Plus size={14} />
                            <span>เพิ่มเหตุผล</span>
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {(!appEditData.reasonsList || appEditData.reasonsList.length === 0) ? (
                          <div style={{ padding: 14, textAlign: 'center', background: '#f8fafc', borderRadius: 8, color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                            {isEditMode ? 'ยังไม่มีรายการเหตุผล (กดปุ่ม "+ เพิ่มเหตุผล" เพื่อเพิ่มข้อความ)' : 'ไม่มีข้อมูลเหตุผล'}
                          </div>
                        ) : (
                          appEditData.reasonsList.map((reasonText, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', width: 20 }}>
                                {idx + 1}.
                              </span>
                              <input
                                type="text"
                                className="form-input-light"
                                placeholder="ระบุเหตุผลความจำเป็น เช่น ครอบครัวมีภาระค่าใช้จ่ายสูง..."
                                value={reasonText}
                                onChange={(e) => {
                                  const next = [...(appEditData.reasonsList || [])];
                                  next[idx] = e.target.value;
                                  setAppEditData({ ...appEditData, reasonsList: next });
                                }}
                                style={{ flex: 1 }}
                              />
                              {isEditMode && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = (appEditData.reasonsList || []).filter((_, i) => i !== idx);
                                    setAppEditData({ ...appEditData, reasonsList: next });
                                  }}
                                  style={{
                                    width: 32,
                                    height: 32,
                                    border: '1px solid #fca5a5',
                                    background: '#fef2f2',
                                    color: '#dc2626',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="ลบข้อนี้"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
              </fieldset>

              {/* Modal Footer */}
              <div style={{
                padding: '14px 24px',
                borderTop: '1px solid #f1f5f9',
                background: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12
              }}>
                <button
                  type="button"
                  onClick={handleDeleteCurrentApp}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease'
                  }}
                  title="ลบใบสมัครนี้ออกจากระบบ"
                >
                  <Trash2 size={14} />
                  <span>ลบใบสมัครนี้</span>
                </button>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      if (isEditMode) {
                        setIsEditMode(false);
                      } else {
                        setIsReviewModalOpen(false);
                      }
                    }}
                    style={{ padding: '8px 20px', fontSize: '0.86rem' }}
                  >
                    {isEditMode ? 'ยกเลิก' : 'ปิด'}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      padding: '8px 24px',
                      fontSize: '0.86rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: 'var(--math-green, #077b38)',
                      borderColor: 'var(--math-green, #077b38)'
                    }}
                  >
                    <Check size={16} strokeWidth={2.2} />
                    <span>บันทึก</span>
                  </button>
                </div>
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

      {/* ========================================== */}
      {/* PRINT PREVIEW MODAL (1. รายชื่อ 2. ใบสมัคร) */}
      {/* ========================================== */}
      {printModalState.isOpen && (
        <div className="modal-backdrop open" style={{ zIndex: 3000, overflowY: 'auto', padding: '20px 10px', alignItems: 'flex-start' }}>
          <div style={{ maxWidth: 940, width: '100%', margin: '20px auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top Toolbar (no-print) */}
            <div className="no-print" style={{
              background: '#ffffff',
              borderRadius: '12px',
              padding: '12px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              position: 'sticky',
              top: 10,
              zIndex: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--navy-900)' }}>
                  {printModalState.type === 'list' ? '🖨️ รายงานสรุปรายชื่อผู้สมัคร (1. รายชื่อ)' : '📄 แบบฟอร์มใบสมัครขอรับทุน (2. ใบสมัคร)'}
                </span>

                {printModalState.type === 'application' && (
                  <select
                    value={printModalState.targetAppId}
                    onChange={(e) => setPrintModalState({ ...printModalState, targetAppId: e.target.value })}
                    style={{ fontSize: '0.84rem', padding: '5px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: 'var(--navy-900)', fontWeight: 500 }}
                  >
                    {selectedAppIds.size > 0 && (
                      <option value="selected">
                        พิมพ์เฉพาะรายชื่อที่เลือกไว้ ({selectedAppIds.size} คน)
                      </option>
                    )}
                    <option value="all">พิมพ์ใบสมัครทุกคนในรายการที่กรอง ({filteredApps.length} คน)</option>
                    {filteredApps.map(a => (
                      <option key={a.trackingId} value={a.trackingId}>
                        {a.fullName} ({a.studentId}) - {a.scholarshipName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 22px',
                    fontSize: '0.88rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'var(--math-green, #077b38)',
                    borderColor: 'var(--math-green, #077b38)'
                  }}
                >
                  <Printer size={16} />
                  <span>สั่งพิมพ์ (Print)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalState({ ...printModalState, isOpen: false })}
                  className="btn btn-secondary"
                  style={{ padding: '8px 18px', fontSize: '0.88rem' }}
                >
                  ปิด
                </button>
              </div>
            </div>

            {/* Document Paper Container */}
            <div className="printable-report-area" style={{
              background: '#ffffff',
              borderRadius: '8px',
              padding: '48px 52px',
              color: '#0f172a',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
              fontFamily: '"Sarabun", "Noto Sans Thai", system-ui, -apple-system, sans-serif'
            }}>
              {/* ========================================== */}
              {/* REPORT 1: รายชื่อผู้สมัคร (NAME LIST REPORT) */}
              {/* ========================================== */}
              {printModalState.type === 'list' && (
                <div>
                  {/* Formal Header */}
                  <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: 16, marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
                      ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์
                    </h2>
                    <h3 style={{ margin: '4px 0 0', fontSize: '1.05rem', fontWeight: 600, color: '#334155' }}>
                      มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
                    </h3>
                    <h1 style={{ margin: '14px 0 6px', fontSize: '1.35rem', fontWeight: 800, color: 'var(--math-green, #077b38)' }}>
                      รายงานสรุปรายชื่อผู้สมัครขอรับทุนการศึกษา
                    </h1>
                    <div style={{ fontSize: '0.9rem', color: '#475569' }}>
                      ประจำปีการศึกษา {siteSettings.academicYear || '2567'} ภาคการศึกษาที่ {siteSettings.semester || '1'}
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, fontSize: '0.86rem', color: '#334155', background: '#f8fafc', padding: '10px 16px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                    <div>
                      <strong>เงื่อนไข:</strong> {selectedAppIds.size > 0 ? `เลือกเฉพาะรายชื่อ (${printListApps.length} คน)` : `${filterScope !== 'all' ? `ประเภท: ${filterScope === 'internal' ? 'ทุนภายใน' : 'ทุนภายนอก'} | ` : ''}${filterType !== 'all' ? `ทุนการศึกษา: ${getFilterTypeLabel(filterType)}` : 'ทุนการศึกษาทั้งหมด'}`} | {filterStatus !== 'all' ? `สถานะ: ${filterStatus}` : 'ทุกสถานะ'}
                    </div>
                    <div>
                      <strong>จำนวนผู้สมัคร:</strong> {printListApps.length} คน | <strong>วันที่ออกรายงาน:</strong> {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>

                  {/* Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem', color: '#0f172a' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ border: '1px solid #94a3b8', padding: '8px 6px', textAlign: 'center', width: 40 }}>ลำดับ</th>
                        <th style={{ border: '1px solid #94a3b8', padding: '8px 10px', textAlign: 'center', width: 110 }}>รหัสนักศึกษา</th>
                        <th style={{ border: '1px solid #94a3b8', padding: '8px 10px', textAlign: 'left' }}>ชื่อ - นามสกุล</th>
                        <th style={{ border: '1px solid #94a3b8', padding: '8px 8px', textAlign: 'center', width: 90 }}>สาขา/ชั้นปี</th>
                        <th style={{ border: '1px solid #94a3b8', padding: '8px 10px', textAlign: 'left' }}>ทุนการศึกษาที่สมัคร</th>
                        <th style={{ border: '1px solid #94a3b8', padding: '8px 6px', textAlign: 'center', width: 55 }}>GPAX</th>
                        <th style={{ border: '1px solid #94a3b8', padding: '8px 8px', textAlign: 'center', width: 85 }}>วันที่ยื่น</th>
                        <th style={{ border: '1px solid #94a3b8', padding: '8px 8px', textAlign: 'center', width: 95 }}>สถานะ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {printListApps.length === 0 ? (
                        <tr>
                          <td colSpan={8} style={{ border: '1px solid #cbd5e1', padding: 24, textAlign: 'center', color: '#64748b' }}>
                            ไม่พบข้อมูลผู้สมัครตามเงื่อนไขที่ระบุ
                          </td>
                        </tr>
                      ) : (
                        printListApps.map((app, idx) => (
                          <tr key={app.trackingId}>
                            <td style={{ border: '1px solid #cbd5e1', padding: '7px 6px', textAlign: 'center' }}>{idx + 1}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '7px 10px', textAlign: 'center', fontFamily: 'monospace', fontWeight: 600 }}>{app.studentId}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '7px 10px', fontWeight: 600 }}>{app.fullName}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '7px 8px', textAlign: 'center' }}>{app.major} {app.year}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '7px 10px' }}>{app.scholarshipName}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '7px 6px', textAlign: 'center', fontWeight: 700 }}>{app.gpax.toFixed(2)}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '7px 8px', textAlign: 'center', fontSize: '0.8rem' }}>{formatThaiDate(app.submissionDate)}</td>
                            <td style={{ border: '1px solid #cbd5e1', padding: '7px 8px', textAlign: 'center', fontSize: '0.8rem' }}>
                              {app.status === 'submitted' ? 'ยื่นใบสมัครแล้ว' : app.status === 'approved' ? 'อนุมัติทุนแล้ว' : app.status === 'rejected' ? 'ไม่ผ่านการคัดเลือก' : app.status}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* Sign-off Blocks */}
                  <div style={{ marginTop: 44, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, textAlign: 'center', fontSize: '0.9rem' }}>
                    <div>
                      <div style={{ marginBottom: 44 }}>ลงชื่อ ................................................................ ผู้จัดทำรายงาน</div>
                      <div>( ................................................................ )</div>
                      <div style={{ color: '#64748b', fontSize: '0.84rem', marginTop: 4 }}>เจ้าหน้าที่ฝ่ายทุนการศึกษา ภาควิชาคณิตศาสตร์</div>
                      <div style={{ color: '#64748b', fontSize: '0.84rem', marginTop: 2 }}>วันที่ ......... / ......... / ...............</div>
                    </div>
                    <div>
                      <div style={{ marginBottom: 44 }}>ลงชื่อ ................................................................ ผู้รับรองรายงาน</div>
                      <div>( ................................................................ )</div>
                      <div style={{ color: '#64748b', fontSize: '0.84rem', marginTop: 4 }}>หัวหน้าภาควิชาคณิตศาสตร์</div>
                      <div style={{ color: '#64748b', fontSize: '0.84rem', marginTop: 2 }}>วันที่ ......... / ......... / ...............</div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================== */}
              {/* REPORT 2: ใบสมัครขอรับทุน (APPLICATION FORM) */}
              {/* ========================================== */}
              {printModalState.type === 'application' && (
                <div>
                  {(printModalState.targetAppId === 'selected'
                    ? printListApps
                    : printModalState.targetAppId === 'all'
                      ? filteredApps
                      : [filteredApps.find(a => a.trackingId === printModalState.targetAppId) || filteredApps[0]]
                  ).filter(Boolean).map((app, appIdx) => {
                    const fd = app.formData || {} as ApplicationFormData;
                    const fullCurrAddr = getFullAddressText(fd.address);
                    const fullIdCardAddr = fd.isIdCardAddress ? fullCurrAddr : getFullAddressText(fd.idCardAddress);

                    return (
                      <div 
                        key={app.trackingId} 
                        className={appIdx > 0 ? 'page-break' : ''} 
                        style={{ 
                          fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif",
                          color: '#000000',
                          background: '#ffffff',
                          lineHeight: 1.5,
                          fontSize: '9pt',
                          paddingTop: appIdx > 0 ? 20 : 0,
                          marginBottom: appIdx > 0 ? 30 : 0
                        }}
                      >
                        {/* ======================================================== */}
                        {/* FORMAL OFFICIAL SCHOLARSHIP APPLICATION FORM             */}
                        {/* ======================================================== */}
                        <div>
                          {/* FORMAL HEADER */}
                          <div style={{ textAlign: 'center', marginBottom: 12 }}>
                            <div style={{ fontSize: '14pt', fontWeight: 800, color: '#000000' }}>
                              ใบสมัครขอรับทุนการศึกษา
                            </div>
                            <div style={{ fontSize: '10.5pt', fontWeight: 700, color: '#1f2937', marginTop: 2 }}>
                              ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
                            </div>
                            <div style={{ fontSize: '9pt', color: '#374151', marginTop: 2 }}>
                              ประจำปีการศึกษา {siteSettings.academicYear || '2567'} ภาคการศึกษาที่ {siteSettings.semester || '1'}
                            </div>
                          </div>

                          {/* TOP META ROW: General info on left and photo on right */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 16 }}>
                            {/* Left: General Scholarship & Application Info */}
                            <div style={{ flex: 1, fontSize: '9.2pt', lineHeight: 1.8 }}>
                              <div>
                                <strong>ทุนการศึกษาที่สมัคร:</strong>{' '}
                                <span style={{ fontWeight: 700, fontSize: '9.8pt' }}>{app.scholarshipName}</span>
                              </div>
                              <div style={{ marginTop: 2 }}>
                                <strong>คณะ:</strong> วิทยาศาสตร์ประยุกต์ &nbsp;&nbsp;&nbsp;&nbsp;
                                <strong>ภาควิชา:</strong> คณิตศาสตร์ &nbsp;&nbsp;&nbsp;&nbsp;
                                <strong>ระดับการศึกษา:</strong> [ ] ปวช. &nbsp;[✓] ปริญญาตรี 4 ปี &nbsp;[ ] ปริญญาโท
                              </div>
                              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 2, fontSize: '8.8pt', color: '#1e293b' }}>
                                <span><strong>เลขที่ใบสมัคร:</strong> #{app.trackingId}</span>
                                <span><strong>วันที่ยื่นสมัคร:</strong> {formatThaiDate(app.submissionDate)}</span>
                                <span>
                                  <strong>สถานะ:</strong>{' '}
                                  {app.status === 'approved' ? 'อนุมัติทุนแล้ว' : app.status === 'rejected' ? 'ไม่ผ่านการพิจารณา' : 'รอการพิจารณา'}
                                </span>
                              </div>
                            </div>

                            {/* Right: Photo Box */}
                            <div style={{
                              border: '1px dashed #94a3b8',
                              width: '105px',
                              height: '130px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              fontSize: '8.5pt',
                              color: '#64748b',
                              background: '#f8fafc',
                              overflow: 'hidden',
                              boxSizing: 'border-box',
                              flexShrink: 0
                            }}>
                              {app.profilePhoto ? (
                                <img src={app.profilePhoto} alt="รูปถ่ายนักศึกษา" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <div>
                                  ติดรูปถ่าย<br />1 - 1.5 นิ้ว
                                </div>
                              )}
                            </div>
                          </div>

                          {/* SECTION ๑: ข้อมูลส่วนบุคคลและการศึกษา */}
                          <div style={{ marginBottom: 12 }}>
                            <div style={{
                              fontWeight: 800,
                              fontSize: '9.8pt',
                              color: '#0f172a',
                              marginBottom: 4
                            }}>
                              ๑. ข้อมูลส่วนบุคคลและข้อมูลการศึกษา
                            </div>
                            <div style={{ paddingLeft: '8px', fontSize: '9.2pt', lineHeight: 1.8 }}>
                              <div>
                                <strong>ชื่อ-นามสกุล:</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '190px', fontWeight: 600, padding: '0 4px' }}>
                                  {app.fullName}
                                </span>
                                {' '}<strong>ชื่อเล่น:</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '60px', textAlign: 'center', padding: '0 4px' }}>
                                  {fd.nickname || '-'}
                                </span>
                                {' '}<strong>รหัสประจำตัวนักศึกษา:</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '130px', fontWeight: 600, padding: '0 4px' }}>
                                  {app.studentId}
                                </span>
                              </div>

                              <div>
                                <strong>สาขาวิชา:</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '190px', fontWeight: 600, padding: '0 4px' }}>
                                  {formatMajorFullName(app.major)}
                                </span>
                                {' '}<strong>ชั้นปีที่:</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '40px', textAlign: 'center', fontWeight: 600, padding: '0 4px' }}>
                                  {app.year}
                                </span>
                                {' '}<strong>เกรดเฉลี่ยสะสม (GPAX):</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '50px', textAlign: 'center', fontWeight: 700, padding: '0 4px' }}>
                                  {app.gpax.toFixed(2)}
                                </span>
                              </div>

                              <div>
                                <strong>เบอร์โทรศัพท์:</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '130px', padding: '0 4px' }}>
                                  {app.phone}
                                </span>
                                {' '}<strong>อีเมล:</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '230px', padding: '0 4px' }}>
                                  {app.email}
                                </span>
                              </div>

                              <div>
                                <strong>ที่อยู่ปัจจุบัน:</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '450px', padding: '0 4px' }}>
                                  {fullCurrAddr}
                                </span>
                              </div>

                              <div>
                                <strong>ที่อยู่ตามภูมิลำเนา (ทะเบียนบ้าน):</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '390px', padding: '0 4px' }}>
                                  {fullIdCardAddr}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* SECTION ๒: ข้อมูลครอบครัวและภาระทางการเงิน */}
                          <div style={{ marginBottom: 12 }}>
                            <div style={{
                              fontWeight: 800,
                              fontSize: '9.8pt',
                              color: '#0f172a',
                              marginBottom: 4
                            }}>
                              ๒. ข้อมูลครอบครัวและภาระทางการเงิน
                            </div>
                            <div style={{ paddingLeft: '8px', fontSize: '9.2pt', lineHeight: 1.8 }}>
                              <div>
                                <strong>ข้อมูลบิดา:</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '150px', fontWeight: 600, padding: '0 4px' }}>
                                  {fd.fatherName || '-'}
                                </span>
                                {' '}<strong>อาชีพ:</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '110px', padding: '0 4px' }}>
                                  {fd.fatherJob || '-'}
                                </span>
                                {' '}<strong>รายได้:</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '95px', textAlign: 'right', padding: '0 4px' }}>
                                  {fd.fatherIncome ? `${Number(fd.fatherIncome).toLocaleString()} บาท/ด.` : '-'}
                                </span>
                                {' '}<strong>สถานภาพ:</strong>{' '}
                                [{fd.fatherAlive !== 'deceased' ? '✓' : ' '}] มีชีวิต{' '}
                                [{fd.fatherAlive === 'deceased' ? '✓' : ' '}] ถึงแก่กรรม
                              </div>

                              <div>
                                <strong>ข้อมูลมารดา:</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '150px', fontWeight: 600, padding: '0 4px' }}>
                                  {fd.motherName || '-'}
                                </span>
                                {' '}<strong>อาชีพ:</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '110px', padding: '0 4px' }}>
                                  {fd.motherJob || '-'}
                                </span>
                                {' '}<strong>รายได้:</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '95px', textAlign: 'right', padding: '0 4px' }}>
                                  {fd.motherIncome ? `${Number(fd.motherIncome).toLocaleString()} บาท/ด.` : '-'}
                                </span>
                                {' '}<strong>สถานภาพ:</strong>{' '}
                                [{fd.motherAlive !== 'deceased' ? '✓' : ' '}] มีชีวิต{' '}
                                [{fd.motherAlive === 'deceased' ? '✓' : ' '}] ถึงแก่กรรม
                              </div>

                              <div>
                                <strong>สถานภาพสมรสของบิดา-มารดา:</strong>{' '}
                                [{fd.parentsRelation === 'together' ? '✓' : ' '}] อยู่ด้วยกัน{' '}
                                [{fd.parentsRelation === 'divorced' ? '✓' : ' '}] แยกกันอยู่/หย่าร้าง{' '}
                                [{fd.parentsRelation === 'other' ? '✓' : ' '}] อื่นๆ
                              </div>

                              <div>
                                <strong>จำนวนพี่น้องร่วมบิดามารดา:</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '40px', textAlign: 'center', fontWeight: 600, padding: '0 4px' }}>
                                  {fd.siblings || '0'}
                                </span>{' '}คน
                                {' '}<strong>สถานะการกู้ยืมเงินเพื่อการศึกษา:</strong>{' '}
                                [{fd.loanStatus !== 'none' ? '✓' : ' '}] กู้ยืม กยศ.{' '}
                                [{fd.loanStatus === 'none' ? '✓' : ' '}] ไม่ได้กู้ยืม
                              </div>

                              <div>
                                <strong>รายได้รวมของครอบครัวโดยประมาณ:</strong>{' '}
                                <span style={{ borderBottom: '1px dotted #475569', display: 'inline-block', minWidth: '150px', textAlign: 'right', fontWeight: 700, padding: '0 4px' }}>
                                  {app.familyIncome ? `${Number(app.familyIncome).toLocaleString()} บาท/เดือน` : '-'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* SECTION ๓: ประวัติกิจกรรมและเหตุผลความจำเป็นในการขอรับทุน */}
                          <div style={{ marginBottom: 12 }}>
                            <div style={{
                              fontWeight: 800,
                              fontSize: '9.8pt',
                              color: '#0f172a',
                              marginBottom: 4
                            }}>
                              ๓. ประวัติกิจกรรมและเหตุผลความจำเป็นในการขอรับทุนการศึกษา
                            </div>
                            <div style={{ paddingLeft: '8px', fontSize: '9.2pt', lineHeight: 1.75 }}>
                              <div>
                                <strong>กิจกรรมที่เคยปฏิบัติ / กิจกรรมจิตอาสา:</strong>{' '}
                                <span>{fd.activities || 'ไม่มีกิจกรรมระบุ'}</span>
                                {fd.volunteerHours > 0 && (
                                  <span style={{ marginLeft: 10 }}>
                                    (จำนวนชั่วโมงจิตอาสา: <strong>{fd.volunteerHours}</strong> ชั่วโมง)
                                  </span>
                                )}
                              </div>

                              <div style={{ marginTop: 4 }}>
                                <strong>เหตุผลความจำเป็นในการขอรับทุนการศึกษา:</strong>
                              </div>
                              <div style={{
                                marginTop: 2,
                                textIndent: '20px',
                                lineHeight: 1.7,
                                color: '#1e293b'
                              }}>
                                {fd.reasonsList && fd.reasonsList.length > 0 ? (
                                  fd.reasonsList.map((r, i) => (
                                    <div key={i}>{i + 1}. {r}</div>
                                  ))
                                ) : (
                                  fd.reason || 'มีความจำเป็นต้องใช้ทุนการศึกษาเพื่อแบ่งเบาภาระค่าใช้จ่ายของครอบครัวในการศึกษาเล่าเรียน'
                                )}
                              </div>
                            </div>
                          </div>

                          {/* SECTION ๔: คำรับรองและการลงนาม (เฉพาะผู้สมัคร) */}
                          <div style={{ marginTop: 14 }}>
                            <div style={{
                              fontWeight: 800,
                              fontSize: '9.8pt',
                              color: '#0f172a',
                              marginBottom: 6
                            }}>
                              ๔. คำรับรองความถูกต้องและการลงนาม
                            </div>
                            <div style={{ paddingLeft: '8px' }}>
                              <div style={{ fontSize: '9pt', textIndent: '28px', textAlign: 'justify', lineHeight: 1.75, marginBottom: 18 }}>
                                "ข้าพเจ้าขอรับรองว่า ข้อความและเอกสารหลักฐานทั้งหมดที่ระบุไว้ในใบสมัครนี้เป็นความจริงทุกประการ หากปรากฏว่าเป็นเท็จ ข้าพเจ้ายินยอมให้ยกเลิกสิทธิ์ในการรับทุนการศึกษาทันที"
                              </div>

                              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingRight: 40, marginTop: 14 }}>
                                <div style={{ textAlign: 'center', fontSize: '9.2pt', lineHeight: 1.85 }}>
                                  <div>ลงชื่อ ................................................................ ผู้สมัคร</div>
                                  <div style={{ marginTop: 4 }}>( {app.fullName} )</div>
                                  <div style={{ marginTop: 3, color: '#475569' }}>วันที่ {formatThaiDate(app.submissionDate)}</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </section>
  );
};
