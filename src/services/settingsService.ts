import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { SiteSettings } from '../types/common';

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  academicYear: '2567',
  semester: '1',
  heroTitle: 'เปิดประตูสู่อนาคต\nทุนการศึกษาคณิตศาสตร์ มจพ.',
  heroSubtitle: 'ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มุ่งมั่นสนับสนุนศักยภาพทางวิชาการและช่วยเหลือนักศึกษาทุกระดับชั้น ทั้งทุนเรียนดี ทุนขาดแคลน ทุนผู้ช่วยสอน (TA) และทุนสนับสนุนงานวิจัย',
  contactPhone: '02-555-2000 ต่อ 4601-4602',
  contactEmail: 'math@sci.kmutnb.ac.th',
  contactAddress: '1518 ถนนประชาราษฎร์ 1 แขวงวงศ์สว่าง เขตบางซื่อ กรุงเทพฯ 10800',
  tickerText: '📢 เปิดรับสมัครทุนการศึกษาภาควิชาคณิตศาสตร์ ประจำภาคการศึกษาที่ 1/2567 ยื่นใบสมัครออนไลน์ได้ตั้งแต่วันนี้',
  facebookUrl: 'https://facebook.com/kmutnb.math'
};

interface DbSiteSetting {
  id: string;
  setting_key: string;
  academic_year: string;
  semester: string;
  hero_title: string;
  hero_subtitle: string;
  contact_phone: string;
  contact_email: string;
  contact_address: string;
  ticker_text: string;
  facebook_url?: string;
  created_at: string;
  updated_at: string;
}

export const settingsService = {
  /**
   * ดึงการตั้งค่าเว็บไซต์จากตาราง site_settings ใน Supabase (ถ้ามี) หรือใช้ค่าเริ่มต้น
   */
  async getSiteSettings(): Promise<{ data: SiteSettings; source: 'supabase' | 'local' }> {
    if (!isSupabaseConfigured()) {
      return { data: DEFAULT_SITE_SETTINGS, source: 'local' };
    }

    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'general')
        .maybeSingle();

      if (error) {
        console.warn('ดึงข้อมูล site_settings จาก Supabase ไม่สำเร็จ:', error.message);
        return { data: DEFAULT_SITE_SETTINGS, source: 'local' };
      }

      if (data) {
        const row = data as DbSiteSetting;
        return {
          data: {
            academicYear: row.academic_year || DEFAULT_SITE_SETTINGS.academicYear,
            semester: row.semester || DEFAULT_SITE_SETTINGS.semester,
            heroTitle: row.hero_title || DEFAULT_SITE_SETTINGS.heroTitle,
            heroSubtitle: row.hero_subtitle || DEFAULT_SITE_SETTINGS.heroSubtitle,
            contactPhone: row.contact_phone || DEFAULT_SITE_SETTINGS.contactPhone,
            contactEmail: row.contact_email || DEFAULT_SITE_SETTINGS.contactEmail,
            contactAddress: row.contact_address || DEFAULT_SITE_SETTINGS.contactAddress,
            tickerText: row.ticker_text || DEFAULT_SITE_SETTINGS.tickerText,
            facebookUrl: row.facebook_url || DEFAULT_SITE_SETTINGS.facebookUrl
          },
          source: 'supabase'
        };
      }

      return { data: DEFAULT_SITE_SETTINGS, source: 'local' };
    } catch (err) {
      console.warn('เกิดข้อผิดพลาดในการดึง site_settings:', err);
      return { data: DEFAULT_SITE_SETTINGS, source: 'local' };
    }
  },

  /**
   * บันทึกหรืออัปเดตการตั้งค่าเว็บไซต์ลงตาราง site_settings ใน Supabase
   */
  async updateSiteSettings(settings: Partial<SiteSettings>): Promise<{ success: boolean; source: 'supabase' | 'local' }> {
    if (!isSupabaseConfigured()) {
      return { success: true, source: 'local' };
    }

    try {
      const payload: Record<string, unknown> = {
        setting_key: 'general',
        updated_at: new Date().toISOString()
      };

      if (settings.academicYear !== undefined) payload.academic_year = settings.academicYear;
      if (settings.semester !== undefined) payload.semester = settings.semester;
      if (settings.heroTitle !== undefined) payload.hero_title = settings.heroTitle;
      if (settings.heroSubtitle !== undefined) payload.hero_subtitle = settings.heroSubtitle;
      if (settings.contactPhone !== undefined) payload.contact_phone = settings.contactPhone;
      if (settings.contactEmail !== undefined) payload.contact_email = settings.contactEmail;
      if (settings.contactAddress !== undefined) payload.contact_address = settings.contactAddress;
      if (settings.tickerText !== undefined) payload.ticker_text = settings.tickerText;
      if (settings.facebookUrl !== undefined) payload.facebook_url = settings.facebookUrl;

      const { error } = await supabase
        .from('site_settings')
        .upsert(payload, { onConflict: 'setting_key' });

      if (error) {
        console.error('Error saving site_settings to Supabase:', error);
        return { success: false, source: 'local' };
      }

      return { success: true, source: 'supabase' };
    } catch (err) {
      console.error('Error updating site_settings:', err);
      return { success: false, source: 'local' };
    }
  }
};
