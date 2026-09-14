import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * ตรวจสอบว่าได้กำหนดค่า URL และ Key ของ Supabase ถูกต้องแล้วหรือไม่
 */
export const isSupabaseConfigured = (): boolean => {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) return false;
  if (!supabaseUrl.startsWith('https://')) return false;
  return true;
};

/**
 * Supabase Client Instance
 * หากยังไม่ได้ระบุคีย์ จะใช้ dummy fallback เพื่อป้องกันไม่ให้ runtime error
 */
export const supabase = createClient(
  isSupabaseConfigured() ? supabaseUrl : 'https://placeholder.supabase.co',
  isSupabaseConfigured() ? supabaseAnonKey : 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

/**
 * ทดสอบการเชื่อมต่อกับ Supabase
 */
export const testSupabaseConnection = async (): Promise<{ success: boolean; message: string }> => {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'ยังไม่ได้ระบุ VITE_SUPABASE_URL หรือ VITE_SUPABASE_ANON_KEY ในไฟล์ .env (ระบบกำลังทำงานในโหมด Demo LocalStorage)',
    };
  }

  try {
    // ทดสอบดึงข้อมูลจากตาราง scholarship_programs (หรือ scholarships)
    const { error } = await supabase.from('scholarship_programs').select('id').limit(1);
    if (error) {
      // ลองตรวจตาราง scholarships เผื่อเป็น schema เดิม
      const { error: fallbackError } = await supabase.from('scholarships').select('id').limit(1);
      if (fallbackError) {
        return {
          success: false,
          message: `เชื่อมต่อ Supabase ล้มเหลว: ${error.message || fallbackError.message}`,
        };
      }
    }
    return {
      success: true,
      message: 'เชื่อมต่อ Supabase สำเร็จ พร้อมใช้งานฐานข้อมูล Real-time',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ${errorMsg}`,
    };
  }
};
