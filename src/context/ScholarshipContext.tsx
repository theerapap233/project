import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Scholarship, ScholarshipCategory } from '../types/scholarship';
import { Application, ApplicationStatus, ApplicationFormData, UploadedFiles } from '../types/application';
import { ToastMessage, ToastType } from '../types/common';
import { INITIAL_SCHOLARSHIPS } from '../data/scholarshipData';
import { INITIAL_APPLICATIONS } from '../data/initialApplications';
import { isSupabaseConfigured, supabase, testSupabaseConnection } from '../lib/supabase';
import { scholarshipService } from '../services/scholarshipService';
import { applicationService } from '../services/applicationService';

export interface UserProfile {
  studentId: string;
  name: string;
  email: string;
  faculty: string;
  major: string;
}

export type SupabaseConnectionStatus = 'connected' | 'demo' | 'error' | 'loading';

interface ScholarshipContextType {
  scholarships: Scholarship[];
  applications: Application[];
  isAdminActive: boolean;
  activeCategory: ScholarshipCategory;
  selectedScholarshipForDetail: Scholarship | null;
  selectedScholarshipIdForApply: string | null;
  isDetailModalOpen: boolean;
  isWizardModalOpen: boolean;
  isSuccessModalOpen: boolean;
  isCommitteeModalOpen: boolean;
  reviewingApplication: Application | null;
  latestTrackingId: string;
  toasts: ToastMessage[];
  searchTrackingId: string;
  currentUser: UserProfile | null;
  isLoginModalOpen: boolean;
  
  // Supabase Status & Helpers
  isSupabaseConnected: boolean;
  supabaseStatus: SupabaseConnectionStatus;
  isLoadingData: boolean;
  refreshData: () => Promise<void>;
  checkConnection: () => Promise<{ success: boolean; message: string }>;

  // Actions
  setActiveCategory: (cat: ScholarshipCategory) => void;
  openScholarshipDetail: (sch: Scholarship) => void;
  closeScholarshipDetail: () => void;
  openApplicationModal: (schId?: string) => void;
  closeApplicationModal: () => void;
  closeSuccessModal: () => void;
  openCommitteeReview: (trackingId: string) => void;
  closeCommitteeReview: () => void;
  toggleAdminView: (forceOpen?: boolean) => void;
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  submitApplication: (data: ApplicationFormData, files: UploadedFiles) => string;
  updateApplicationReview: (
    trackingId: string, 
    status: ApplicationStatus, 
    score: number | null, 
    interviewDate: string, 
    notes: string
  ) => void;
  quickApprove: (trackingId: string) => void;
  createNewScholarship: (title: string, amount: string, totalSlots: number) => void;
  exportApplicationsCSV: () => void;
  setSearchTrackingId: (id: string) => void;
  scrollToSection: (id: string) => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (studentId: string, name?: string) => void;
  logout: () => void;
}

const ScholarshipContext = createContext<ScholarshipContextType | undefined>(undefined);

const LOCAL_STORAGE_APPS_KEY = 'KMUTNB_SCH_APPLICATIONS';
const LOCAL_STORAGE_SCH_KEY = 'KMUTNB_SCH_SCHOLARSHIPS';

export const ScholarshipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [scholarships, setScholarships] = useState<Scholarship[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SCH_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_SCHOLARSHIPS;
  });

  const [applications, setApplications] = useState<Application[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return INITIAL_APPLICATIONS;
  });

  const [isAdminActive, setIsAdminActive] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<ScholarshipCategory>('all');
  const [selectedScholarshipForDetail, setSelectedScholarshipForDetail] = useState<Scholarship | null>(null);
  const [selectedScholarshipIdForApply, setSelectedScholarshipIdForApply] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isWizardModalOpen, setIsWizardModalOpen] = useState<boolean>(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState<boolean>(false);
  const [reviewingApplication, setReviewingApplication] = useState<Application | null>(null);
  const [latestTrackingId, setLatestTrackingId] = useState<string>('KMUTNB-SCH-670101');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [searchTrackingId, setSearchTrackingId] = useState<string>('KMUTNB-SCH-670101');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('KMUTNB_SCH_USER');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Supabase Connection State
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseConnectionStatus>(
    isSupabaseConfigured() ? 'loading' : 'demo'
  );
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // ดึงข้อมูลจาก Supabase (ถ้ามี) หรือ Fallback ไปยัง LocalStorage
  const loadData = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setSupabaseStatus('demo');
      return;
    }

    setIsLoadingData(true);
    try {
      const [schResult, appResult] = await Promise.all([
        scholarshipService.getAllScholarships(),
        applicationService.getAllApplications(),
      ]);

      if (schResult.source === 'supabase') {
        setScholarships(schResult.data);
      }
      if (appResult.source === 'supabase') {
        setApplications(appResult.data);
      }

      setSupabaseStatus('connected');
    } catch (error) {
      console.error('Error loading Supabase data:', error);
      setSupabaseStatus('error');
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // โหลดข้อมูลเมื่อ Mount และตั้งค่า Realtime Subscription
  useEffect(() => {
    loadData();

    if (!isSupabaseConfigured()) return;

    // Realtime listener สำหรับ scholarship_applications table
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'scholarship_applications' },
        (payload) => {
          console.log('Realtime change received from Supabase:', payload);
          // อัปเดตข้อมูลอัตโนมัติเมื่อมีการเปลี่ยนแปลงในฐานข้อมูล
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const checkConnection = async () => {
    const res = await testSupabaseConnection();
    if (res.success) {
      setSupabaseStatus('connected');
      showToast(res.message, 'success');
      loadData();
    } else {
      setSupabaseStatus(isSupabaseConfigured() ? 'error' : 'demo');
      showToast(res.message, 'info');
    }
    return res;
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  const login = (studentId: string, name?: string) => {
    const user: UserProfile = {
      studentId: studentId || '6604062610099',
      name: name || 'นายสมคิด มุ่งมั่นวิทยา',
      email: `${studentId || 's6604062610099'}@kmutnb.ac.th`,
      faculty: 'คณะวิทยาศาสตร์ประยุกต์',
      major: 'ภาควิชาคณิตศาสตร์ (คณิตศาสตร์ประยุกต์)'
    };
    setCurrentUser(user);
    localStorage.setItem('KMUTNB_SCH_USER', JSON.stringify(user));
    setIsLoginModalOpen(false);
    showToast(`เข้าสู่ระบบสำเร็จ: ยินดีต้อนรับ ${user.name}`, 'success');
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('KMUTNB_SCH_USER');
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_APPS_KEY, JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SCH_KEY, JSON.stringify(scholarships));
  }, [scholarships]);

  const scrollToSection = (id: string) => {
    if (id === 'adminSection' && !isAdminActive) {
      setIsAdminActive(true);
    }
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  };

  const openScholarshipDetail = (sch: Scholarship) => {
    setSelectedScholarshipForDetail(sch);
    setSelectedScholarshipIdForApply(sch.id);
    setIsDetailModalOpen(true);
  };

  const closeScholarshipDetail = () => {
    setIsDetailModalOpen(false);
  };

  const openApplicationModal = (schId?: string) => {
    if (schId) {
      setSelectedScholarshipIdForApply(schId);
    } else if (!selectedScholarshipIdForApply && scholarships.length > 0) {
      setSelectedScholarshipIdForApply(scholarships[0].id);
    }
    setIsWizardModalOpen(true);
  };

  const closeApplicationModal = () => {
    setIsWizardModalOpen(false);
  };

  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
  };

  const openCommitteeReview = (trackingId: string) => {
    const app = applications.find(a => a.trackingId === trackingId);
    if (app) {
      setReviewingApplication(app);
      setIsCommitteeModalOpen(true);
    }
  };

  const closeCommitteeReview = () => {
    setIsCommitteeModalOpen(false);
    setReviewingApplication(null);
  };

  const toggleAdminView = (forceOpen?: boolean) => {
    setIsAdminActive(prev => {
      const nextState = forceOpen !== undefined ? forceOpen : !prev;
      showToast(nextState ? 'เปิดโหมดกรรมการพิจารณาทุนการศึกษา' : 'ปิดโหมดกรรมการ', 'info');
      return nextState;
    });
  };

  const submitApplication = (data: ApplicationFormData, files: UploadedFiles): string => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const trackingId = `KMUTNB-SCH-67${randomSuffix}`;
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const matchedScholarship = scholarships.find(s => s.id === data.scholarshipId);
    const scholarshipName = matchedScholarship ? matchedScholarship.title : 'ทุนการศึกษา ภาควิชาคณิตศาสตร์';

    const uploadedList: string[] = [];
    if (files.doc1) uploadedList.push(files.doc1);
    if (files.doc2) uploadedList.push(files.doc2);
    if (files.doc3) uploadedList.push(files.doc3);

    const newApp: Application = {
      trackingId,
      scholarshipId: data.scholarshipId,
      scholarshipName,
      studentId: data.studentId,
      fullName: data.fullName,
      major: data.major,
      year: data.year,
      gpax: data.gpax,
      familyIncome: data.familyIncome,
      phone: data.phone,
      email: data.email,
      submissionDate: dateStr,
      status: 'submitted',
      interviewDate: 'รอการตรวจสอบเอกสาร',
      score: null,
      committeeNotes: 'ยื่นใบสมัครออนไลน์ผ่านระบบ',
      documents: uploadedList
    };

    // อัปเดตใน Local State ทันทีเพื่อให้ UI ตอบสนองรวดเร็ว
    setApplications(prev => [newApp, ...prev]);
    setLatestTrackingId(trackingId);
    setSearchTrackingId(trackingId);
    setIsWizardModalOpen(false);
    setIsSuccessModalOpen(true);

    // บันทึกไปยัง Supabase ในพื้นหลัง (ถ้าเชื่อมต่อ)
    if (isSupabaseConfigured()) {
      applicationService.submitFullApplication(data, files, newApp).then(res => {
        if (res.source === 'supabase') {
          showToast(`ยื่นใบสมัครสำเร็จและบันทึกสู่ Supabase Cloud! รหัสติดตาม: ${trackingId}`, 'success');
        } else {
          showToast(`ยื่นใบสมัครสำเร็จ (บันทึกในเครื่อง): รหัสติดตาม: ${trackingId}`, 'info');
        }
      });
    } else {
      showToast(`ยื่นใบสมัครสำเร็จ! รหัสติดตาม: ${trackingId}`, 'success');
    }

    return trackingId;
  };

  const updateApplicationReview = (
    trackingId: string, 
    status: ApplicationStatus, 
    score: number | null, 
    interviewDate: string, 
    notes: string
  ) => {
    // อัปเดต Local State
    setApplications(prev => prev.map(app => {
      if (app.trackingId === trackingId) {
        return {
          ...app,
          status,
          score,
          interviewDate: interviewDate || app.interviewDate,
          committeeNotes: notes
        };
      }
      return app;
    }));

    setIsCommitteeModalOpen(false);
    setReviewingApplication(null);

    // บันทึกไปยัง Supabase
    if (isSupabaseConfigured()) {
      applicationService.updateApplicationReview(trackingId, status, score, interviewDate, notes).then(ok => {
        if (ok) {
          showToast(`บันทึกผลการพิจารณาสำหรับ ${trackingId} ลงฐานข้อมูล Supabase แล้ว`, 'success');
        } else {
          showToast(`บันทึกผลการพิจารณาในเครื่องเรียบร้อยแล้ว`, 'info');
        }
      });
    } else {
      showToast(`บันทึกผลการพิจารณาสำหรับ ${trackingId} เรียบร้อยแล้ว`, 'success');
    }
  };

  const quickApprove = (trackingId: string) => {
    const target = applications.find(a => a.trackingId === trackingId);
    if (!target) return;

    if (window.confirm(`ยืนยันการอนุมัติทุนการศึกษาให้แก่ "${target.fullName}" ใช่หรือไม่?`)) {
      setApplications(prev => prev.map(app => {
        if (app.trackingId === trackingId) {
          return {
            ...app,
            status: 'approved',
            score: app.score ?? 90,
            committeeNotes: 'อนุมัติทุนการศึกษาโดยมติคณะกรรมการภาควิชาคณิตศาสตร์'
          };
        }
        return app;
      }));

      if (isSupabaseConfigured()) {
        applicationService.quickApprove(trackingId).then(ok => {
          if (ok) {
            showToast(`อนุมัติทุน ${trackingId} บันทึกลง Supabase สำเร็จ`, 'success');
          } else {
            showToast(`อนุมัติทุน ${trackingId} เรียบร้อยแล้ว`, 'success');
          }
        });
      } else {
        showToast(`อนุมัติทุน ${trackingId} เรียบร้อยแล้ว`, 'success');
      }
    }
  };

  const createNewScholarship = (title: string, amount: string, totalSlots: number) => {
    const newSch: Scholarship = {
      id: `sch-${Date.now()}`,
      code: `MATH-NEW-${Math.floor(1000 + Math.random() * 9000)}`,
      title,
      category: 'academic',
      categoryName: 'ทุนเรียนดี / พัฒนาศักยภาพ',
      badgeColor: 'gold',
      amount: amount || '20,000 บาท / ภาคการศึกษา',
      totalSlots,
      remainingSlots: totalSlots,
      academicYear: '2567',
      term: 'ภาคการศึกษาที่ 1',
      deadline: '2026-11-15',
      status: 'open',
      minGPAX: 2.75,
      targetYears: ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'],
      targetMajors: ['ทุกสาขาวิชาในภาควิชาคณิตศาสตร์'],
      description: `ประกาศทุนการศึกษาใหม่ของภาควิชาคณิตศาสตร์ มจพ. เพื่อส่งเสริมนักศึกษาตามนโยบายสนับสนุนทุนปี 2567`,
      requirements: [
        'เป็นนักศึกษาภาควิชาคณิตศาสตร์ มจพ.',
        'มีเกรดเฉลี่ยสะสมไม่ต่ำกว่า 2.75',
        'มีความประพฤติเรียบร้อย'
      ],
      documents: [
        'ใบแสดงผลการเรียน (Transcript)',
        'สำเนาบัตรนักศึกษา'
      ],
      fundingSource: 'กองทุนภาควิชาคณิตศาสตร์ มจพ.'
    };

    setScholarships(prev => [newSch, ...prev]);

    if (isSupabaseConfigured()) {
      scholarshipService.createScholarship(newSch).then(ok => {
        if (ok) {
          showToast(`เพิ่มประกาศทุน "${title}" บันทึกลง Supabase สำเร็จ`, 'success');
        } else {
          showToast(`เพิ่มประกาศทุน "${title}" ในเครื่องสำเร็จ`, 'success');
        }
      });
    } else {
      showToast(`เพิ่มประกาศทุน "${title}" สำเร็จ`, 'success');
    }
  };

  const exportApplicationsCSV = () => {
    if (applications.length === 0) {
      showToast('ไม่มีข้อมูลใบสมัครสำหรับส่งออก', 'warning');
      return;
    }

    const headers = [
      "รหัสติดตาม", "รหัสนักศึกษา", "ชื่อนามสกุล", "สาขาวิชา", "ชั้นปี", 
      "ทุนที่สมัคร", "GPAX", "รายได้ครอบครัว", "เบอร์โทร", "อีเมล", 
      "วันที่ยื่น", "สถานะ", "คะแนน", "ความเห็นกรรมการ"
    ];

    const rows = applications.map(app => [
      `"${app.trackingId}"`,
      `"${app.studentId}"`,
      `"${app.fullName}"`,
      `"${app.major}"`,
      `"${app.year}"`,
      `"${app.scholarshipName}"`,
      app.gpax,
      app.familyIncome,
      `"${app.phone}"`,
      `"${app.email}"`,
      `"${app.submissionDate}"`,
      `"${app.status}"`,
      app.score ?? '',
      `"${(app.committeeNotes || '').replace(/"/g, '""')}"`
    ]);

    // Prepend UTF-8 BOM for Excel Thai language support
    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `KMUTNB_Math_Scholarships_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('ส่งออกข้อมูลไฟล์ CSV เรียบร้อยแล้ว', 'success');
  };

  return (
    <ScholarshipContext.Provider
      value={{
        scholarships,
        applications,
        isAdminActive,
        activeCategory,
        selectedScholarshipForDetail,
        selectedScholarshipIdForApply,
        isDetailModalOpen,
        isWizardModalOpen,
        isSuccessModalOpen,
        isCommitteeModalOpen,
        reviewingApplication,
        latestTrackingId,
        toasts,
        searchTrackingId,
        currentUser,
        isLoginModalOpen,
        isSupabaseConnected: supabaseStatus === 'connected',
        supabaseStatus,
        isLoadingData,
        refreshData: loadData,
        checkConnection,
        openLoginModal,
        closeLoginModal,
        login,
        logout,
        setActiveCategory,
        openScholarshipDetail,
        closeScholarshipDetail,
        openApplicationModal,
        closeApplicationModal,
        closeSuccessModal,
        openCommitteeReview,
        closeCommitteeReview,
        toggleAdminView,
        showToast,
        removeToast,
        submitApplication,
        updateApplicationReview,
        quickApprove,
        createNewScholarship,
        exportApplicationsCSV,
        setSearchTrackingId,
        scrollToSection
      }}
    >
      {children}
    </ScholarshipContext.Provider>
  );
};

export const useScholarship = () => {
  const context = useContext(ScholarshipContext);
  if (!context) {
    throw new Error('useScholarship must be used within a ScholarshipProvider');
  }
  return context;
};
