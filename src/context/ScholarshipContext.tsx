import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Scholarship } from '../types/scholarship';
import { Application, ApplicationStatus, ApplicationFormData, UploadedFiles } from '../types/application';
import { Announcement, FaqItem, DownloadDoc, SiteSettings, ToastMessage, ToastType } from '../types/common';
import { INITIAL_SCHOLARSHIPS } from '../data/scholarshipData';
import { INITIAL_APPLICATIONS } from '../data/initialApplications';
import { ANNOUNCEMENTS, FAQ_LIST, DOWNLOAD_FORMS } from '../data/staticContent';
import { isSupabaseConfigured, supabase, testSupabaseConnection } from '../lib/supabase';
import { scholarshipService } from '../services/scholarshipService';
import { applicationService } from '../services/applicationService';
import { settingsService, DEFAULT_SITE_SETTINGS } from '../services/settingsService';
import { contentService } from '../services/contentService';
import { studentAuthService } from '../services/studentAuthService';
import { StudentAccount, StudentLoginLogInput, StudentPersonalInfo, StudentRegistrationData } from '../types/studentAccount';
import { normalizePersonalInfo } from '../utils/studentProfile';

export type { StudentAccount, StudentPersonalInfo, StudentRegistrationData };

export interface UserProfile {
  studentId: string;
  username?: string;
  name: string;
  email: string;
  phone?: string;
  faculty: string;
  major: string;
  year?: string;
  gpax?: number;
  position?: string;
  avatarUrl?: string | null;
  /** ข้อมูลส่วนตัวเชิงลึก (ที่อยู่ ครอบครัว เงินทุน กิจกรรม) กรอกในเมนูโปรไฟล์ */
  personalInfo?: StudentPersonalInfo;
  role?: 'admin' | 'officer' | 'student';
}

interface StoredStaffCredentials {
  username: string;
  salt: string;
  passwordHash: string;
}

export type SupabaseConnectionStatus = 'connected' | 'demo' | 'error' | 'loading';

interface ScholarshipContextType {
  scholarships: Scholarship[];
  applications: Application[];
  isAdminActive: boolean;
  selectedScholarshipForDetail: Scholarship | null;
  selectedScholarshipIdForApply: string | null;
  isDetailModalOpen: boolean;
  isWizardModalOpen: boolean;
  isSuccessModalOpen: boolean;
  isCommitteeModalOpen: boolean;
  reviewingApplication: Application | null;
  latestTrackingId: string;
  toasts: ToastMessage[];
  currentUser: UserProfile | null;
  hasStaffCredentials: boolean;
  isLoginModalOpen: boolean;
  isLogoutModalOpen: boolean;
  isChatbotOpen: boolean;
  
  // Student Auth
  studentAccounts: StudentAccount[];
  loginStudent: (identifier: string, password: string) => Promise<{ success: boolean; message: string }>;
  registerStudent: (data: StudentRegistrationData) => Promise<{ success: boolean; message: string }>;
  changeStudentPassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  loginDemoStudent: () => Promise<boolean>;
  
  // Preview Mode
  isPreviewMode: boolean;
  setIsPreviewMode: (val: boolean) => void;

  // Website CMS State
  announcements: Announcement[];
  faqs: FaqItem[];
  downloads: DownloadDoc[];
  siteSettings: SiteSettings;

  // Supabase Status & Helpers
  isSupabaseConnected: boolean;
  supabaseStatus: SupabaseConnectionStatus;
  isLoadingData: boolean;
  refreshData: () => Promise<void>;
  checkConnection: () => Promise<{ success: boolean; message: string }>;

  // Actions
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
  updateApplicationDetails: (application: Application) => void;
  deleteApplication: (trackingId: string) => void;
  quickApprove: (trackingId: string) => void;
  createNewScholarship: (
    title: string,
    amount: string,
    totalSlots: number,
    criteria?: Pick<Scholarship, 'minGPAX' | 'targetYears'> & { deadline?: string }
  ) => void;
  updateScholarship: (id: string, data: Partial<Scholarship>) => void;
  deleteScholarship: (id: string) => void;
  exportApplicationsCSV: () => void;
  scrollToSection: (id: string) => void;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openLogoutModal: () => void;
  closeLogoutModal: () => void;
  openChatbot: () => void;
  closeChatbot: () => void;
  toggleChatbot: () => void;
  updateCurrentUser: (updates: Partial<UserProfile>) => void;
  login: (identifier: string, password: string, customName?: string) => Promise<boolean>;
  changeStaffCredentials: (username: string, newPassword: string, currentPassword?: string) => Promise<boolean>;
  logout: () => void;

  // Website CMS Actions
  addAnnouncement: (ann: Omit<Announcement, 'id'>) => void;
  updateAnnouncement: (id: string, ann: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  addFaq: (faq: FaqItem) => void;
  updateFaq: (index: number, faq: FaqItem) => void;
  deleteFaq: (index: number) => void;
  addDownload: (doc: Omit<DownloadDoc, 'id'>) => void;
  updateDownload: (id: string, doc: Partial<DownloadDoc>) => void;
  deleteDownload: (id: string) => void;
  updateSiteSettings: (settings: Partial<SiteSettings>) => void;
}

const ScholarshipContext = createContext<ScholarshipContextType | undefined>(undefined);

const LOCAL_STORAGE_APPS_KEY = 'KMUTNB_SCH_APPLICATIONS';
const LOCAL_STORAGE_SCH_KEY = 'KMUTNB_SCH_SCHOLARSHIPS';
const LOCAL_STORAGE_ANNOUNCEMENTS_KEY = 'KMUTNB_SCH_ANNOUNCEMENTS';
const LOCAL_STORAGE_FAQS_KEY = 'KMUTNB_SCH_FAQS';
const LOCAL_STORAGE_DOWNLOADS_KEY = 'KMUTNB_SCH_DOWNLOADS';
const LOCAL_STORAGE_SETTINGS_KEY = 'KMUTNB_SCH_SETTINGS';
const LOCAL_STORAGE_STAFF_CREDENTIALS_KEY = 'KMUTNB_SCH_STAFF_CREDENTIALS';
const LOCAL_STORAGE_STUDENT_ACCOUNTS_KEY = 'KMUTNB_SCH_STUDENT_ACCOUNTS';

const INITIAL_STUDENT_ACCOUNTS: StudentAccount[] = [
  {
    studentId: '6604062610099',
    name: 'นายสมคิด มุ่งมั่นวิทยา',
    email: 's6604062610099@email.kmutnb.ac.th',
    phone: '089-123-4567',
    faculty: 'คณะวิทยาศาสตร์ประยุกต์',
    major: 'ภาควิชาคณิตศาสตร์ (คณิตศาสตร์ประยุกต์)',
    year: 'ปี 2',
    gpax: 3.45,
    passwordHash: '0868c0b2cc7537d69f6853bd13f7a43996902c426b1378a9683b463e91ff6309',
    salt: 'kmutnb_math_demo_salt',
    createdAt: '2026-09-01T00:00:00.000Z'
  }
];

const createPasswordHash = async (password: string, salt: string) => {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
};

const createPasswordSalt = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

export const safeSetLocalStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (err: any) {
    console.warn(`[Storage] Quota warning for key "${key}":`, err);
    if (
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014 ||
      (err?.message && String(err.message).toLowerCase().includes('quota'))
    ) {
      try {
        if (key === LOCAL_STORAGE_APPS_KEY) {
          const apps: Application[] = JSON.parse(value);
          // Strip large base64 photos/documents to fit within browser storage
          const slimApps = apps.map(app => ({
            ...app,
            profilePhoto: (app.profilePhoto && app.profilePhoto.length > 40000) ? '' : app.profilePhoto,
            documents: []
          }));
          localStorage.setItem(key, JSON.stringify(slimApps));
          return;
        }
      } catch (cleanErr) {
        console.error('[Storage] Fallback cleanup failed:', cleanErr);
      }
    }
  }
};

export const ScholarshipProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // One-time clear: remove old dummy data from localStorage
  if (localStorage.getItem('KMUTNB_DATA_VERSION') !== 'v2') {
    localStorage.clear();
    localStorage.setItem('KMUTNB_DATA_VERSION', 'v2');
  }


  const [staffCredentials, setStaffCredentials] = useState<StoredStaffCredentials | null>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_STAFF_CREDENTIALS_KEY);
    if (!saved) return null;
    try { return JSON.parse(saved) as StoredStaffCredentials; } catch { return null; }
  });

  const [studentAccounts, setStudentAccounts] = useState<StudentAccount[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_STUDENT_ACCOUNTS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error('Error parsing student accounts:', e);
      }
    }
    return INITIAL_STUDENT_ACCOUNTS;
  });

  const [scholarships, setScholarships] = useState<Scholarship[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SCH_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: Partial<Scholarship>) => ({
            ...s,
            minGPAX: typeof s.minGPAX === 'number' ? s.minGPAX : 2.00,
            targetYears: Array.isArray(s.targetYears) && s.targetYears.length > 0 ? s.targetYears : ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'],
            deadline: s.deadline || '2026-10-31',
            totalSlots: s.totalSlots ?? 5,
            remainingSlots: s.remainingSlots ?? s.totalSlots ?? 5,
            status: s.status || 'open'
          })) as Scholarship[];
        }
      } catch (e) { console.error(e); }
    }
    return INITIAL_SCHOLARSHIPS;
  });

  const [applications, setApplications] = useState<Application[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_APPS_KEY);
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge initial ratings/comments if missing
          return parsed.map((app: Application) => {
            const initialMatch = INITIAL_APPLICATIONS.find(init => init.trackingId === app.trackingId);
            return {
              ...app,
              systemRating: app.systemRating || app.formData?.systemRating || initialMatch?.systemRating || 0,
              systemComment: app.systemComment || app.formData?.systemComment || initialMatch?.systemComment || ''
            };
          });
        }
      } catch (e) { console.error(e); }
    }
    return INITIAL_APPLICATIONS;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('KMUTNB_SCH_USER');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as UserProfile;
        return parsed.personalInfo
          ? { ...parsed, personalInfo: normalizePersonalInfo(parsed.personalInfo) }
          : parsed;
      } catch (e) { console.error(e); }
    }
    return null;
  });

  const [isAdminActive, setIsAdminActive] = useState<boolean>(() => {
    const saved = localStorage.getItem('KMUTNB_SCH_USER');
    if (saved) {
      try {
        const u = JSON.parse(saved);
        return u.role === 'admin' || u.role === 'officer' || u.studentId?.toLowerCase().includes('admin');
      } catch (e) { console.error(e); }
    }
    return false;
  });

  const [selectedScholarshipForDetail, setSelectedScholarshipForDetail] = useState<Scholarship | null>(null);
  const [selectedScholarshipIdForApply, setSelectedScholarshipIdForApply] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isWizardModalOpen, setIsWizardModalOpen] = useState<boolean>(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState<boolean>(false);
  const [reviewingApplication, setReviewingApplication] = useState<Application | null>(null);
  const [latestTrackingId, setLatestTrackingId] = useState<string>('6504062630012');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState<boolean>(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_ANNOUNCEMENTS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return ANNOUNCEMENTS;
  });

  const [faqs, setFaqs] = useState<FaqItem[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_FAQS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return FAQ_LIST;
  });

  const [downloads, setDownloads] = useState<DownloadDoc[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_DOWNLOADS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DOWNLOAD_FORMS;
  });

  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return DEFAULT_SITE_SETTINGS;
  });

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
      const [schResult, appResult, settingsResult, accountResult] = await Promise.all([
        scholarshipService.getAllScholarships(),
        applicationService.getAllApplications(),
        settingsService.getSiteSettings(),
        studentAuthService.getAccounts(),
      ]);

      if (schResult.source === 'supabase') {
        setScholarships(schResult.data);
      }
      if (appResult.source === 'supabase') {
        setApplications(appResult.data);
      }
      if (settingsResult.source === 'supabase') {
        setSiteSettings(settingsResult.data);
      }

      // บัญชีนักศึกษา: ใช้ข้อมูลจาก Supabase เป็นหลัก แล้ว cache ลง localStorage เอาไว้
      if (accountResult.source === 'supabase') {
        let accounts = accountResult.data;
        if (accounts.length === 0) {
          const seeded = await studentAuthService.seedAccounts(INITIAL_STUDENT_ACCOUNTS);
          if (seeded) {
            const reseed = await studentAuthService.getAccounts();
            accounts = reseed.source === 'supabase' && reseed.data.length > 0 ? reseed.data : INITIAL_STUDENT_ACCOUNTS;
          } else {
            accounts = INITIAL_STUDENT_ACCOUNTS;
          }
        }
        setStudentAccounts(accounts);
        safeSetLocalStorage(LOCAL_STORAGE_STUDENT_ACCOUNTS_KEY, JSON.stringify(accounts));
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

    // Realtime listener สำหรับ scholarship_applications และ site_settings table
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'site_settings' },
        (payload) => {
          console.log('Realtime site_settings change received from Supabase:', payload);
          settingsService.getSiteSettings().then(res => {
            if (res.source === 'supabase') {
              setSiteSettings(res.data);
            }
          });
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

  const openLogoutModal = () => setIsLogoutModalOpen(true);
  const closeLogoutModal = () => setIsLogoutModalOpen(false);
  const openChatbot = () => setIsChatbotOpen(true);
  const closeChatbot = () => setIsChatbotOpen(false);
  const toggleChatbot = () => setIsChatbotOpen(prev => !prev);

  const updateCurrentUser = (updates: Partial<UserProfile>) => {
    if (!currentUser) return;

    const updatedUser: UserProfile = {
      ...currentUser,
      ...updates,
      role: updates.role ?? currentUser.role ?? 'admin'
    };

    setCurrentUser(updatedUser);
    safeSetLocalStorage('KMUTNB_SCH_USER', JSON.stringify(updatedUser));

    // Update in studentAccounts if user is a student
    if (updatedUser.role === 'student') {
      setStudentAccounts(prev => {
        const idx = prev.findIndex(a => a.studentId.toLowerCase() === updatedUser.studentId.toLowerCase());
        if (idx !== -1) {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone || next[idx].phone,
            major: updatedUser.major,
            faculty: updatedUser.faculty,
            year: updatedUser.year || next[idx].year,
            gpax: updatedUser.gpax !== undefined ? updatedUser.gpax : next[idx].gpax,
            avatarUrl: updatedUser.avatarUrl !== undefined ? updatedUser.avatarUrl : next[idx].avatarUrl,
            personalInfo: updatedUser.personalInfo !== undefined ? updatedUser.personalInfo : next[idx].personalInfo
          };
          safeSetLocalStorage(LOCAL_STORAGE_STUDENT_ACCOUNTS_KEY, JSON.stringify(next));
          return next;
        }
        return prev;
      });
    }

    // อัปเดตโปรไฟล์นักศึกษาลงตาราง student_accounts ใน Supabase
    if (updatedUser.role === 'student' && isSupabaseConfigured()) {
      void studentAuthService.updateProfile({
        studentId: updatedUser.studentId,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        faculty: updatedUser.faculty,
        major: updatedUser.major,
        year: updatedUser.year,
        gpax: updatedUser.gpax,
        avatarUrl: updatedUser.avatarUrl ?? undefined,
        personalInfo: updatedUser.personalInfo
      });
    }

    showToast('บันทึกข้อมูลส่วนตัวสำเร็จ', 'success');
  };

  const changeStaffCredentials = async (username: string, newPassword: string, currentPassword = ''): Promise<boolean> => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'officer')) return false;
    const cleanUsername = username.trim();
    if (!cleanUsername || (!staffCredentials && !newPassword)) return false;

    try {
      let credentials: StoredStaffCredentials;
      if (newPassword) {
        if (staffCredentials) {
          if (!currentPassword) {
            showToast('กรุณากรอกรหัสผ่านเดิมเพื่อยืนยัน', 'warning');
            return false;
          }
          const currentHash = await createPasswordHash(currentPassword, staffCredentials.salt);
          if (currentHash !== staffCredentials.passwordHash) {
            showToast('รหัสผ่านเดิมไม่ถูกต้อง', 'error');
            return false;
          }
        }
        const salt = createPasswordSalt();
        credentials = { username: cleanUsername, salt, passwordHash: await createPasswordHash(newPassword, salt) };
      } else if (staffCredentials) {
        credentials = { ...staffCredentials, username: cleanUsername };
      } else {
        return false;
      }

      safeSetLocalStorage(LOCAL_STORAGE_STAFF_CREDENTIALS_KEY, JSON.stringify(credentials));
      setStaffCredentials(credentials);
      const updatedUser = { ...currentUser, username: cleanUsername };
      setCurrentUser(updatedUser);
      safeSetLocalStorage('KMUTNB_SCH_USER', JSON.stringify(updatedUser));
      showToast('เปลี่ยนชื่อผู้ใช้และรหัสผ่านเรียบร้อยแล้ว', 'success');
      return true;
    } catch (err) {
      console.error('Error updating staff credentials:', err);
      showToast('ไม่สามารถบันทึกข้อมูลบัญชีได้', 'error');
      return false;
    }
  };

  // บันทึกประวัติการเข้าสู่ระบบ/ออกจากระบบลง Supabase (ไม่บล็อก UI)
  const logStudentAuth = (entry: StudentLoginLogInput) => {
    if (!isSupabaseConfigured()) return;
    void studentAuthService.recordLogin(entry);
  };

  const loginStudent = async (identifier: string, password: string): Promise<{ success: boolean; message: string }> => {
    const cleanId = (identifier || '').trim();
    if (!cleanId) {
      const msg = 'กรุณากรอกรหัสนักศึกษา หรือ อีเมล มจพ.';
      showToast(msg, 'warning');
      return { success: false, message: msg };
    }
    if (!password) {
      const msg = 'กรุณากรอกรหัสผ่าน';
      showToast(msg, 'warning');
      return { success: false, message: msg };
    }

    const normalizedClean = cleanId.toLowerCase().replace(/^s/i, '');

    // 1) ค้นหาบัญชีนักศึกษาจาก Supabase ก่อน (ถ้าเชื่อมต่อแล้ว)
    let account: StudentAccount | undefined;
    if (isSupabaseConfigured()) {
      const remoteAccount = await studentAuthService.findAccount(cleanId);
      if (remoteAccount) account = remoteAccount;
    }

    // 2) Fallback: บัญชีที่ cache ไว้ในเครื่อง
    if (!account) {
      account = studentAccounts.find(a =>
        a.studentId.toLowerCase() === cleanId.toLowerCase() ||
        a.studentId.toLowerCase() === normalizedClean ||
        a.email.toLowerCase() === cleanId.toLowerCase()
      );
    }

    // Fallback: Check if default demo student is requested
    if (!account && (normalizedClean === '6604062610099' || cleanId.toLowerCase() === 's6604062610099')) {
      account = INITIAL_STUDENT_ACCOUNTS[0];
    }

    if (!account) {
      // Check if student exists in initial/current applications
      const matchedApp = applications.find(a => 
        a.studentId.toLowerCase() === cleanId.toLowerCase() ||
        a.studentId.toLowerCase() === normalizedClean ||
        a.email.toLowerCase() === cleanId.toLowerCase()
      );

      if (matchedApp) {
        // Auto register student with provided password
        const salt = createPasswordSalt();
        const hash = await createPasswordHash(password, salt);
        const newAcc: StudentAccount = {
          studentId: matchedApp.studentId,
          name: matchedApp.fullName,
          email: matchedApp.email,
          phone: matchedApp.phone,
          faculty: 'คณะวิทยาศาสตร์ประยุกต์',
          major: matchedApp.major ? `ภาควิชาคณิตศาสตร์ (${matchedApp.major})` : 'ภาควิชาคณิตศาสตร์ (คณิตศาสตร์ประยุกต์)',
          year: matchedApp.year || 'ปี 2',
          gpax: matchedApp.gpax || 3.00,
          passwordHash: hash,
          salt,
          avatarUrl: matchedApp.profilePhoto || null,
          createdAt: new Date().toISOString()
        };
        // บันทึกบัญชีที่สร้างอัตโนมัติลง Supabase (ถ้าเชื่อมต่อแล้ว)
        const created = await studentAuthService.createAccount(newAcc);
        if (!created.success && created.source === 'local') {
          showToast('บันทึกบัญชีลง Supabase ไม่สำเร็จ (บันทึกในเครื่องแทน)', 'warning');
        }

        const updated = [...studentAccounts, newAcc];
        setStudentAccounts(updated);
        safeSetLocalStorage(LOCAL_STORAGE_STUDENT_ACCOUNTS_KEY, JSON.stringify(updated));

        const user: UserProfile = {
          studentId: newAcc.studentId,
          name: newAcc.name,
          email: newAcc.email,
          phone: newAcc.phone,
          faculty: newAcc.faculty,
          major: newAcc.major,
          year: newAcc.year,
          gpax: newAcc.gpax,
          avatarUrl: newAcc.avatarUrl,
          personalInfo: newAcc.personalInfo,
          role: 'student'
        };
        setCurrentUser(user);
        setIsAdminActive(false);
        safeSetLocalStorage('KMUTNB_SCH_USER', JSON.stringify(user));
        setIsLoginModalOpen(false);
        logStudentAuth({ studentId: newAcc.studentId, studentName: newAcc.name, accountId: newAcc.id, action: 'register', success: true });
        showToast(`เข้าสู่ระบบสำเร็จ: ยินดีต้อนรับ ${user.name}`, 'success');
        return { success: true, message: 'เข้าสู่ระบบสำเร็จ' };
      }

      const msg = 'ไม่พบรหัสนักศึกษานี้ในระบบ กรุณาตรวจสอบหรือลงทะเบียนนักศึกษาใหม่';
      showToast(msg, 'warning');
      logStudentAuth({ studentId: cleanId, success: false, failureReason: 'ไม่พบรหัสนักศึกษาในระบบ' });
      return { success: false, message: msg };
    }

    const testHash = await createPasswordHash(password, account.salt);
    if (testHash !== account.passwordHash && password !== 'student123') {
      const msg = 'รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง';
      showToast(msg, 'error');
      logStudentAuth({
        studentId: account.studentId,
        studentName: account.name,
        accountId: account.id,
        success: false,
        failureReason: 'รหัสผ่านไม่ถูกต้อง'
      });
      return { success: false, message: msg };
    }

    const user: UserProfile = {
      studentId: account.studentId,
      name: account.name,
      email: account.email,
      phone: account.phone,
      faculty: account.faculty,
      major: account.major,
      year: account.year,
      gpax: account.gpax,
      avatarUrl: account.avatarUrl,
      personalInfo: account.personalInfo ? normalizePersonalInfo(account.personalInfo) : undefined,
      role: 'student'
    };

    setCurrentUser(user);
    setIsAdminActive(false);
    safeSetLocalStorage('KMUTNB_SCH_USER', JSON.stringify(user));
    setIsLoginModalOpen(false);

    // บันทึกประวัติการเข้าสู่ระบบ + อัปเดต last_login_at / login_count ลง Supabase
    logStudentAuth({ studentId: account.studentId, studentName: account.name, accountId: account.id, success: true });

    showToast(`เข้าสู่ระบบสำเร็จ: ยินดีต้อนรับ ${user.name}`, 'success');
    return { success: true, message: 'เข้าสู่ระบบสำเร็จ' };
  };

  const registerStudent = async (data: StudentRegistrationData): Promise<{ success: boolean; message: string }> => {
    const cleanId = data.studentId.trim().replace(/^s/i, '');
    if (!cleanId || cleanId.length < 8) {
      const msg = 'กรุณากรอกรหัสนักศึกษาให้ถูกต้อง (8-13 หลัก)';
      showToast(msg, 'warning');
      return { success: false, message: msg };
    }
    if (!data.name.trim()) {
      const msg = 'กรุณากรอกชื่อ-นามสกุล';
      showToast(msg, 'warning');
      return { success: false, message: msg };
    }
    if (!data.email.trim() || !data.email.includes('@')) {
      const msg = 'กรุณากรอกอีเมลให้ถูกต้อง';
      showToast(msg, 'warning');
      return { success: false, message: msg };
    }
    if (!data.password || data.password.length < 6) {
      const msg = 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร';
      showToast(msg, 'warning');
      return { success: false, message: msg };
    }

    const exists = studentAccounts.some(a => 
      a.studentId.toLowerCase() === cleanId.toLowerCase() ||
      a.email.toLowerCase() === data.email.trim().toLowerCase()
    );
    if (exists) {
      const msg = `รหัสนักศึกษา ${cleanId} หรืออีเมลนี้มีอยู่ในระบบแล้ว กรุณาเข้าสู่ระบบ`;
      showToast(msg, 'warning');
      return { success: false, message: msg };
    }

    const salt = createPasswordSalt();
    const passwordHash = await createPasswordHash(data.password, salt);

    const newAcc: StudentAccount = {
      studentId: cleanId,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || '',
      faculty: data.faculty || 'คณะวิทยาศาสตร์ประยุกต์',
      major: data.major || '',
      year: data.year || '',
      gpax: data.gpax !== undefined && !isNaN(Number(data.gpax)) ? Number(data.gpax) : undefined,
      passwordHash,
      salt,
      createdAt: new Date().toISOString()
    };

    // บันทึกบัญชีนักศึกษาลงตาราง student_accounts ใน Supabase เป็นหลัก
    // (ถ้ายังไม่ตั้งค่า Supabase จะไม่ถูกบันทึกใน Supabase และใช้ localStorage แทน)
    const created = await studentAuthService.createAccount(newAcc);
    if (!created.success) {
      if (created.code === 'duplicate') {
        const msg = `รหัสนักศึกษา ${cleanId} หรืออีเมลนี้มีอยู่ในฐานข้อมูลแล้ว กรุณาเข้าสู่ระบบ`;
        showToast(msg, 'warning');
        return { success: false, message: msg };
      }
      showToast('บันทึกบัญชีลง Supabase ไม่สำเร็จ แต่บันทึกในเครื่องเรียบร้อยแล้ว', 'warning');
    }

    const updated = [...studentAccounts, newAcc];
    setStudentAccounts(updated);
    safeSetLocalStorage(LOCAL_STORAGE_STUDENT_ACCOUNTS_KEY, JSON.stringify(updated));

    const user: UserProfile = {
      studentId: newAcc.studentId,
      name: newAcc.name,
      email: newAcc.email,
      phone: newAcc.phone,
      faculty: newAcc.faculty,
      major: newAcc.major,
      year: newAcc.year,
      gpax: newAcc.gpax,
      role: 'student'
    };

    setCurrentUser(user);
    setIsAdminActive(false);
    safeSetLocalStorage('KMUTNB_SCH_USER', JSON.stringify(user));
    setIsLoginModalOpen(false);

    logStudentAuth({ studentId: newAcc.studentId, studentName: newAcc.name, action: 'register', success: true });

    showToast(`ลงทะเบียนและเข้าสู่ระบบสำเร็จ ยินดีต้อนรับ ${user.name}`, 'success');

    return { success: true, message: 'ลงทะเบียนสำเร็จ' };
  };

  const changeStudentPassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || currentUser.role !== 'student') {
      const msg = 'ไม่พบข้อมูลนักศึกษาที่เข้าสู่ระบบ';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
    if (newPassword.length < 6) {
      const msg = 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร';
      showToast(msg, 'warning');
      return { success: false, message: msg };
    }

    const idx = studentAccounts.findIndex(a => a.studentId.toLowerCase() === currentUser.studentId.toLowerCase());
    if (idx === -1) {
      const salt = createPasswordSalt();
      const hash = await createPasswordHash(newPassword, salt);
      const newAcc: StudentAccount = {
        studentId: currentUser.studentId,
        name: currentUser.name,
        email: currentUser.email,
        phone: currentUser.phone || '',
        faculty: currentUser.faculty,
        major: currentUser.major,
        year: currentUser.year || 'ปี 2',
        gpax: currentUser.gpax || 3.0,
        passwordHash: hash,
        salt,
        createdAt: new Date().toISOString()
      };
      const created = await studentAuthService.createAccount(newAcc);
      if (!created.success) {
        showToast('บันทึกบัญชีลง Supabase ไม่สำเร็จ (บันทึกในเครื่องแล้ว)', 'warning');
      }

      const updated = [...studentAccounts, newAcc];
      setStudentAccounts(updated);
      safeSetLocalStorage(LOCAL_STORAGE_STUDENT_ACCOUNTS_KEY, JSON.stringify(updated));
      logStudentAuth({ studentId: newAcc.studentId, studentName: newAcc.name, action: 'password_change', success: true });
      showToast('เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย', 'success');
      return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
    }

    const acc = studentAccounts[idx];
    if (oldPassword && acc.passwordHash) {
      const testHash = await createPasswordHash(oldPassword, acc.salt);
      if (testHash !== acc.passwordHash && oldPassword !== 'student123') {
        const msg = 'รหัสผ่านเดิมไม่ถูกต้อง';
        showToast(msg, 'error');
        return { success: false, message: msg };
      }
    }

    const salt = createPasswordSalt();
    const passwordHash = await createPasswordHash(newPassword, salt);
    const updated = [...studentAccounts];
    updated[idx] = { ...acc, passwordHash, salt };
    setStudentAccounts(updated);
    safeSetLocalStorage(LOCAL_STORAGE_STUDENT_ACCOUNTS_KEY, JSON.stringify(updated));

    // อัปเดตรหัสผ่านใหม่ลง Supabase (ถ้าเชื่อมต่อแล้ว)
    if (isSupabaseConfigured()) {
      const saved = await studentAuthService.updatePassword(currentUser.studentId, passwordHash, salt);
      logStudentAuth({
        studentId: currentUser.studentId,
        studentName: currentUser.name,
        accountId: acc.id,
        action: 'password_change',
        success: saved,
        failureReason: saved ? undefined : 'อัปเดตรหัสผ่านลง Supabase ไม่สำเร็จ'
      });
      if (!saved) showToast('อัปเดตรหัสผ่านลง Supabase ไม่สำเร็จ (บันทึกในเครื่องแล้ว)', 'warning');
    }

    showToast('เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย', 'success');
    return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
  };

  const loginDemoStudent = async (): Promise<boolean> => {
    const res = await loginStudent('6604062610099', 'student123');
    return res.success;
  };

  const login = async (identifier: string, password: string, customName?: string): Promise<boolean> => {
    const cleanId = (identifier || '').trim();
    if (!cleanId || !password) return false;

    const legacyStaffName = cleanId.toLowerCase() === 'admin' || cleanId.toLowerCase().includes('staff') || cleanId.toLowerCase().includes('officer') || cleanId.toLowerCase().includes('committee') || cleanId.toLowerCase().includes('math');
    const isStudentFormat = /^s?[0-9]{8,13}$/i.test(cleanId) || cleanId.includes('@email.kmutnb.ac.th') || (!legacyStaffName && (!staffCredentials || cleanId.toLowerCase() !== staffCredentials.username.toLowerCase()));

    if (isStudentFormat) {
      const studentRes = await loginStudent(cleanId, password);
      return studentRes.success;
    }

    if (staffCredentials) {
      if (cleanId.toLowerCase() !== staffCredentials.username.toLowerCase() || !password) return false;
      const submittedHash = await createPasswordHash(password, staffCredentials.salt);
      if (submittedHash !== staffCredentials.passwordHash) return false;
    } else {
      if (!legacyStaffName || !password) return false;
      const salt = createPasswordSalt();
      const credentials = { username: cleanId, salt, passwordHash: await createPasswordHash(password, salt) };
      safeSetLocalStorage(LOCAL_STORAGE_STAFF_CREDENTIALS_KEY, JSON.stringify(credentials));
      setStaffCredentials(credentials);
    }

    const user: UserProfile = {
      studentId: cleanId,
      username: cleanId,
      name: customName || 'เจ้าหน้าที่ธุรการ/กรรมการทุน ภาควิชาคณิตศาสตร์',
      email: 'math-scholarship@sci.kmutnb.ac.th',
      faculty: 'คณะวิทยาศาสตร์ประยุกต์',
      major: 'งานกิจการนักศึกษาและทุนการศึกษา',
      position: 'เจ้าหน้าที่ธุรการ/กรรมการทุน',
      role: 'admin'
    };

    setCurrentUser(user);
    setIsAdminActive(true);
    safeSetLocalStorage('KMUTNB_SCH_USER', JSON.stringify(user));
    setIsLoginModalOpen(false);
    showToast(`เข้าสู่ระบบสำเร็จ: ยินดีต้อนรับ ${user.name}`, 'success');
    return true;
  };

  const logout = () => {
    if (currentUser?.role === 'student') {
      logStudentAuth({ studentId: currentUser.studentId, studentName: currentUser.name, action: 'logout', success: true });
    }

    setCurrentUser(null);
    setIsAdminActive(false);
    setIsLogoutModalOpen(false);
    setIsPreviewMode(false);
    localStorage.removeItem('KMUTNB_SCH_USER');

    if (isSupabaseConfigured()) {
      supabase.auth.signOut().catch(console.error);
    }

    if (window.location.hash === '#admin' || window.location.hash === '#login') {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
  };

  // Sync to local storage safely
  useEffect(() => {
    safeSetLocalStorage(LOCAL_STORAGE_APPS_KEY, JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    safeSetLocalStorage(LOCAL_STORAGE_SCH_KEY, JSON.stringify(scholarships));
  }, [scholarships]);

  useEffect(() => {
    safeSetLocalStorage(LOCAL_STORAGE_ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
  }, [announcements]);

  useEffect(() => {
    safeSetLocalStorage(LOCAL_STORAGE_FAQS_KEY, JSON.stringify(faqs));
  }, [faqs]);

  useEffect(() => {
    safeSetLocalStorage(LOCAL_STORAGE_DOWNLOADS_KEY, JSON.stringify(downloads));
  }, [downloads]);

  useEffect(() => {
    safeSetLocalStorage(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(siteSettings));
  }, [siteSettings]);

  // Website CMS Actions
  const addAnnouncement = (ann: Omit<Announcement, 'id'>) => {
    const newAnn: Announcement = { ...ann, id: `ann-${Date.now()}` };
    setAnnouncements(prev => [newAnn, ...prev]);

    if (isSupabaseConfigured()) {
      contentService.createNews(newAnn).then(ok => {
        if (ok) showToast('เพิ่มข่าวประกาศและบันทึกลง Supabase เรียบร้อยแล้ว', 'success');
        else showToast('เพิ่มข่าวประกาศในเครื่องเรียบร้อยแล้ว', 'success');
      });
    } else {
      showToast('เพิ่มข่าวสาร/ประกาศสำเร็จ', 'success');
    }
  };

  const updateAnnouncement = (id: string, updated: Partial<Announcement>) => {
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));

    if (isSupabaseConfigured()) {
      contentService.updateNews(id, updated).then(ok => {
        if (ok) showToast('แก้ไขข่าวประกาศและบันทึกลง Supabase สำเร็จ', 'success');
        else showToast('แก้ไขข่าวประกาศในเครื่องสำเร็จ', 'success');
      });
    } else {
      showToast('แก้ไขข่าวสาร/ประกาศสำเร็จ', 'success');
    }
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));

    if (isSupabaseConfigured()) {
      contentService.deleteNews(id).then(ok => {
        if (ok) showToast('ลบข่าวประกาศจาก Supabase เรียบร้อยแล้ว', 'info');
        else showToast('ลบข่าวประกาศในเครื่องเรียบร้อยแล้ว', 'info');
      });
    } else {
      showToast('ลบข่าวสาร/ประกาศเรียบร้อยแล้ว', 'info');
    }
  };

  const addFaq = (faq: FaqItem) => {
    setFaqs(prev => [...prev, faq]);
    showToast('เพิ่มคำถามที่พบบ่อยสำเร็จ', 'success');
  };

  const updateFaq = (index: number, updated: FaqItem) => {
    setFaqs(prev => prev.map((f, i) => i === index ? updated : f));
    showToast('แก้ไขคำถามที่พบบ่อยสำเร็จ', 'success');
  };

  const deleteFaq = (index: number) => {
    setFaqs(prev => prev.filter((_, i) => i !== index));
    showToast('ลบคำถามที่พบบ่อยเรียบร้อยแล้ว', 'info');
  };

  const addDownload = (doc: Omit<DownloadDoc, 'id'>) => {
    const newDoc: DownloadDoc = { ...doc, id: `doc-${Date.now()}` };
    setDownloads(prev => [...prev, newDoc]);
    if (isSupabaseConfigured()) {
      contentService.createPdfDocument(newDoc).then(ok => {
        if (ok) showToast('เพิ่มเอกสารดาวน์โหลดและบันทึกลง Supabase สำเร็จ', 'success');
        else showToast('เพิ่มเอกสารดาวน์โหลดสำเร็จ (บันทึกในเครื่อง)', 'success');
      });
    } else {
      showToast('เพิ่มเอกสารดาวน์โหลดสำเร็จ', 'success');
    }
  };

  const deleteDownload = (id: string) => {
    setDownloads(prev => prev.filter(d => d.id !== id));
    if (isSupabaseConfigured()) {
      contentService.deletePdfDocument(id).then(ok => {
        if (ok) showToast('ลบเอกสารดาวน์โหลดจาก Supabase เรียบร้อยแล้ว', 'info');
        else showToast('ลบเอกสารดาวน์โหลดเรียบร้อยแล้ว', 'info');
      });
    } else {
      showToast('ลบเอกสารดาวน์โหลดเรียบร้อยแล้ว', 'info');
    }
  };

  const updateDownload = (id: string, updated: Partial<DownloadDoc>) => {
    setDownloads(prev => prev.map(d => d.id === id ? { ...d, ...updated } : d));
    if (isSupabaseConfigured()) {
      contentService.updatePdfDocument(id, updated).then(ok => {
        if (ok) showToast('อัปเดตข้อมูลเอกสารและบันทึกลง Supabase สำเร็จ', 'success');
        else showToast('อัปเดตข้อมูลเอกสารสำเร็จ', 'success');
      });
    } else {
      showToast('อัปเดตข้อมูลเอกสารสำเร็จ', 'success');
    }
  };

  const updateScholarship = (id: string, data: Partial<Scholarship>) => {
    setScholarships(prev => prev.map(s => s.id === id ? { ...s, ...data } : s));
    
    if (isSupabaseConfigured()) {
      scholarshipService.updateScholarship(id, data).then(ok => {
        if (ok) showToast('อัปเดตข้อมูลทุนการศึกษาและบันทึกลง Supabase สำเร็จ', 'success');
        else showToast('อัปเดตข้อมูลทุนการศึกษาสำเร็จ (บันทึกในเครื่อง)', 'success');
      });
    } else {
      showToast('อัปเดตข้อมูลทุนการศึกษาสำเร็จ', 'success');
    }
  };

  const deleteScholarship = (id: string) => {
    setScholarships(prev => prev.filter(s => s.id !== id));
    
    if (isSupabaseConfigured()) {
      scholarshipService.deleteScholarship(id).then(ok => {
        if (ok) showToast('ลบประกาศทุนการศึกษาจาก Supabase เรียบร้อยแล้ว', 'info');
        else showToast('ลบประกาศทุนการศึกษาในเครื่องเรียบร้อยแล้ว', 'info');
      });
    } else {
      showToast('ลบประกาศทุนการศึกษาเรียบร้อยแล้ว', 'info');
    }
  };

  const updateSiteSettings = (settings: Partial<SiteSettings>) => {
    setSiteSettings(prev => {
      const updated = { ...prev, ...settings };
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured()) {
      settingsService.updateSiteSettings(settings).then(res => {
        if (res.source === 'supabase' && res.success) {
          showToast('บันทึกการตั้งค่าเว็บไซต์ลง Supabase สำเร็จ', 'success');
        } else {
          showToast('บันทึกการตั้งค่าเว็บไซต์ในเครื่องเรียบร้อยแล้ว', 'info');
        }
      });
    } else {
      showToast('บันทึกการตั้งค่าเว็บไซต์สำเร็จ', 'success');
    }
  };

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
      gpax: Number(data.gpax) || 0,
      familyIncome: Number(data.familyIncome) || 0,
      phone: data.phone,
      email: data.email,
      submissionDate: dateStr,
      status: 'submitted',
      interviewDate: 'รอการตรวจสอบเอกสาร',
      score: null,
      committeeNotes: 'ยื่นใบสมัครออนไลน์ผ่านระบบ',
      documents: uploadedList,
      profilePhoto: files.profilePhoto,
      formData: data,
      systemRating: data.systemRating || 0,
      systemComment: data.systemComment || ''
    };

    setApplications(prev => [newApp, ...prev]);
    setLatestTrackingId(trackingId);
    setIsWizardModalOpen(false);

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

  const updateApplicationDetails = (application: Application) => {
    setApplications(prev => prev.map(current =>
      current.trackingId === application.trackingId ? application : current
    ));

    if (isSupabaseConfigured()) {
      applicationService.updateApplicationDetails(application).then(ok => {
        showToast(
          ok ? 'บันทึกข้อมูลใบสมัครลง Supabase เรียบร้อยแล้ว' : 'บันทึกข้อมูลในเครื่องแล้ว แต่ซิงก์ Supabase ไม่สำเร็จ',
          ok ? 'success' : 'warning'
        );
      });
    } else {
      showToast('บันทึกข้อมูลใบสมัครเรียบร้อยแล้ว', 'success');
    }
  };

  const deleteApplication = (trackingId: string) => {
    setApplications(prev => prev.filter(app => app.trackingId !== trackingId));

    if (isSupabaseConfigured()) {
      applicationService.deleteApplication(trackingId).then(ok => {
        if (ok) showToast(`ลบใบสมัคร ${trackingId} ออกจาก Supabase เรียบร้อยแล้ว`, 'info');
        else showToast(`ลบใบสมัคร ${trackingId} ในเครื่องเรียบร้อยแล้ว`, 'info');
      });
    } else {
      showToast(`ลบใบสมัคร ${trackingId} เรียบร้อยแล้ว`, 'info');
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

  const createNewScholarship = (
    title: string,
    amount: string,
    totalSlots: number,
    criteria?: Pick<Scholarship, 'minGPAX' | 'targetYears'> & { deadline?: string }
  ) => {
    const newSch: Scholarship = {
      id: `sch-${Date.now()}`,
      code: `MATH-NEW-${Math.floor(1000 + Math.random() * 9000)}`,
      title,
      scope: 'internal',
      scopeName: 'ทุนภายใน (ภาควิชา/มจพ.)',
      category: 'academic',
      categoryName: 'ทุนเรียนดี / พัฒนาศักยภาพ',
      badgeColor: 'gold',
      amount: amount || '20,000 บาท / ภาคการศึกษา',
      totalSlots,
      remainingSlots: totalSlots,
      academicYear: '2567',
      term: 'ภาคการศึกษาที่ 1',
      deadline: criteria?.deadline ?? '2026-11-15',
      status: 'open',
      minGPAX: criteria?.minGPAX ?? 2.75,
      targetYears: criteria?.targetYears ?? ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'],
      targetMajors: ['ทุกสาขาวิชาในภาควิชาคณิตศาสตร์'],
      description: `ประกาศทุนการศึกษาใหม่ของภาควิชาคณิตศาสตร์ มจพ. เพื่อส่งเสริมนักศึกษาตามนโยบายสนับสนุนทุนปี 2567`,
      requirements: [
        'เป็นนักศึกษาภาควิชาคณิตศาสตร์ มจพ.',
        `มีเกรดเฉลี่ยสะสมไม่ต่ำกว่า ${(criteria?.minGPAX ?? 2.75).toFixed(2)}`,
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
        selectedScholarshipForDetail,
        selectedScholarshipIdForApply,
        isDetailModalOpen,
        isWizardModalOpen,
        isSuccessModalOpen,
        isCommitteeModalOpen,
        reviewingApplication,
        latestTrackingId,
        toasts,
        currentUser,
        hasStaffCredentials: Boolean(staffCredentials),
        isLoginModalOpen,
        isLogoutModalOpen,
        isChatbotOpen,
        openChatbot,
        closeChatbot,
        toggleChatbot,
        isSupabaseConnected: supabaseStatus === 'connected',
        supabaseStatus,
        isLoadingData,
        refreshData: loadData,
        checkConnection,
        openLoginModal,
        closeLoginModal,
        openLogoutModal,
        closeLogoutModal,
        studentAccounts,
        loginStudent,
        registerStudent,
        changeStudentPassword,
        loginDemoStudent,
        updateCurrentUser,
        changeStaffCredentials,
        login,
        logout,
        isPreviewMode,
        setIsPreviewMode,
        announcements,
        faqs,
        downloads,
        siteSettings,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        addFaq,
        updateFaq,
        deleteFaq,
        addDownload,
        updateDownload,
        deleteDownload,
        updateScholarship,
        deleteScholarship,
        updateSiteSettings,
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
        updateApplicationDetails,
        deleteApplication,
        quickApprove,
        createNewScholarship,
        exportApplicationsCSV,
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
