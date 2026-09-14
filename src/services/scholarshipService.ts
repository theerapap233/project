import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Scholarship, ScholarshipCategory } from '../types/scholarship';
import { INITIAL_SCHOLARSHIPS } from '../data/scholarshipData';

interface DbScholarshipProgram {
  id: string;
  name: string;
  category_id: string | null;
  amount: number | null;
  quota: number | null;
  is_open: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
  category?: {
    id: string;
    name: string;
  } | null;
}

// แปลงชื่อหมวดหมู่ภาษาไทยเป็น slug category สำหรับฟิลเตอร์ UI
const mapCategoryNameToSlug = (catName?: string): Exclude<ScholarshipCategory, 'all'> => {
  if (!catName) return 'academic';
  if (catName.includes('เรียนดี') || catName.includes('วิชาการ')) return 'academic';
  if (catName.includes('ขาดแคลน') || catName.includes('ทุนทรัพย์')) return 'need';
  if (catName.includes('ทำงาน') || catName.includes('ผู้ช่วย') || catName.includes('TA')) return 'work';
  if (catName.includes('ศิษย์เก่า')) return 'alumni';
  if (catName.includes('กิจกรรม') || catName.includes('จิตสาธารณะ') || catName.includes('อาสา')) return 'activity';
  return 'academic';
};

const getBadgeColorByCategory = (category: Exclude<ScholarshipCategory, 'all'>): Scholarship['badgeColor'] => {
  switch (category) {
    case 'academic': return 'gold';
    case 'need': return 'blue';
    case 'work': return 'purple';
    case 'alumni': return 'emerald';
    case 'activity': return 'orange';
    default: return 'gold';
  }
};

const mapProgramToScholarship = (row: DbScholarshipProgram, index: number): Scholarship => {
  const categoryName = row.category?.name || 'ทุนการศึกษา ภาควิชาคณิตศาสตร์';
  const categorySlug = mapCategoryNameToSlug(categoryName);
  const badgeColor = getBadgeColorByCategory(categorySlug);

  // สกัด Code หรือกำหนด Code เริ่มต้น
  const codeMatch = row.name.match(/\((MATH-[A-Z]+-\d+)\)/);
  const code = codeMatch ? codeMatch[1] : `MATH-SCH-${String(index + 1).padStart(2, '0')}`;

  return {
    id: row.id,
    code,
    title: row.name.replace(/\s*\([A-Z0-9-]+\)\s*$/, ''),
    category: categorySlug,
    categoryName,
    badgeColor,
    amount: row.amount ? `${Number(row.amount).toLocaleString()} บาท / ภาคการศึกษา` : 'ตามประกาศภาควิชา',
    totalSlots: row.quota || 10,
    remainingSlots: Math.max(1, Math.floor((row.quota || 10) * 0.4)),
    academicYear: '2567',
    term: 'ภาคการศึกษาที่ 1',
    deadline: '2026-10-31',
    status: row.is_open ? 'open' : 'closed',
    minGPAX: categorySlug === 'academic' ? 3.00 : 2.00,
    targetYears: ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4', 'บัณฑิตศึกษา'],
    targetMajors: ['คณิตศาสตร์ประยุกต์', 'สถิติประยุกต์และการวิเคราะห์ข้อมูล'],
    description: row.description || 'ทุนการศึกษาเพื่อส่งเสริมศักยภาพนักศึกษา ภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มจพ.',
    requirements: [
      'เป็นนักศึกษาภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มจพ.',
      categorySlug === 'academic' ? 'มีผลการเรียนสะสม GPAX ไม่ต่ำกว่า 3.00' : 'มีความประพฤติดีและตั้งใจศึกษาเล่าเรียน',
      'ไม่เคยถูกลงโทษทางวินัยนักศึกษา'
    ],
    documents: [
      'ใบแสดงผลการเรียน (Transcript)',
      'สำเนาบัตรประจำตัวนักศึกษา',
      'เอกสารรับรองคุณสมบัติตามเกณฑ์ของทุน'
    ],
    fundingSource: 'กองทุนภาควิชาคณิตศาสตร์ คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ'
  };
};

export const scholarshipService = {
  /**
   * ดึงโครงการทุนทั้งหมดจากตาราง scholarship_programs เชื่อมกับ scholarship_categories
   */
  async getAllScholarships(): Promise<{ data: Scholarship[]; source: 'supabase' | 'local' }> {
    if (!isSupabaseConfigured()) {
      return { data: INITIAL_SCHOLARSHIPS, source: 'local' };
    }

    try {
      const { data, error } = await supabase
        .from('scholarship_programs')
        .select(`
          id,
          name,
          category_id,
          amount,
          quota,
          is_open,
          description,
          created_at,
          updated_at,
          category:scholarship_categories (
            id,
            name
          )
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped = (data as unknown as DbScholarshipProgram[]).map(mapProgramToScholarship);
        return { data: mapped, source: 'supabase' };
      }

      // ถ้าตารางยังว่างอยู่ ให้ใช้ initial scholarships
      return { data: INITIAL_SCHOLARSHIPS, source: 'local' };
    } catch (err) {
      console.warn('ดึงข้อมูล scholarship_programs ไม่สำเร็จ, สลับไปใช้ข้อมูลภายในเครื่อง:', err);
      return { data: INITIAL_SCHOLARSHIPS, source: 'local' };
    }
  },

  /**
   * ดึงรายการหมวดหมู่ทุนจากตาราง scholarship_categories
   */
  async getCategories(): Promise<{ id: string; name: string }[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('scholarship_categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching scholarship categories:', err);
      return [];
    }
  },

  /**
   * เพิ่มโครงการทุนใหม่ลงตาราง scholarship_programs
   */
  async createScholarship(sch: Scholarship): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    try {
      // ดึง category_id ที่ตรงกัน หรือใส่ null
      const categories = await this.getCategories();
      const matchedCat = categories.find(c => 
        c.name.toLowerCase().includes(sch.categoryName.toLowerCase()) || 
        sch.categoryName.toLowerCase().includes(c.name.toLowerCase())
      );

      const parsedAmount = parseInt(sch.amount.replace(/[^0-9]/g, '')) || 20000;

      const { error } = await supabase.from('scholarship_programs').insert([
        {
          name: `${sch.title} (${sch.code})`,
          category_id: matchedCat ? matchedCat.id : null,
          amount: parsedAmount,
          quota: sch.totalSlots,
          is_open: sch.status === 'open',
          description: sch.description,
        }
      ]);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error creating scholarship_program in Supabase:', err);
      return false;
    }
  },

  /**
   * ปรับสถานะเปิด/ปิดรับสมัคร
   */
  async toggleScholarshipStatus(programId: string, isOpen: boolean): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    try {
      const { error } = await supabase
        .from('scholarship_programs')
        .update({ is_open: isOpen, updated_at: new Date().toISOString() })
        .eq('id', programId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error updating scholarship status:', err);
      return false;
    }
  }
};
