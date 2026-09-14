import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { ANNOUNCEMENTS, DOWNLOAD_FORMS } from '../data/staticContent';
import { Announcement, DownloadDoc } from '../types/common';

export const contentService = {
  /**
   * ดึงข่าวสารและประกาศจากตาราง news (ถ้าต่อ Supabase) หรือจาก static data
   */
  async getNews(): Promise<Announcement[]> {
    if (!isSupabaseConfigured()) {
      return ANNOUNCEMENTS;
    }

    try {
      const { data, error } = await supabase
        .from('news')
        .select(`
          id,
          title,
          content,
          image_url,
          created_at,
          category:news_categories (
            name
          )
        `)
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        return ANNOUNCEMENTS;
      }

      return data.map((row: Record<string, unknown>, idx: number) => {
        const catObj = row.category as { name?: string } | null;
        const categoryName = catObj?.name || 'ข่าวประชาสัมพันธ์';
        const dateStr = typeof row.created_at === 'string' ? row.created_at.slice(0, 10) : 'ล่าสุด';

        return {
          id: (row.id as string) || `news-${idx}`,
          title: (row.title as string) || '',
          date: dateStr,
          tag: categoryName,
          tagType: 'primary',
          summary: (row.content as string) || '',
          linkText: 'อ่านประกาศฉบับเต็ม'
        };
      });
    } catch {
      return ANNOUNCEMENTS;
    }
  },

  /**
   * ดึงรายการเอกสารดาวน์โหลดจากตาราง pdf_documents
   */
  async getPdfDocuments(): Promise<DownloadDoc[]> {
    if (!isSupabaseConfigured()) {
      return DOWNLOAD_FORMS;
    }

    try {
      const { data, error } = await supabase
        .from('pdf_documents')
        .select(`
          id,
          name,
          size,
          url,
          category:pdf_document_categories (
            name
          )
        `)
        .order('name');

      if (error || !data || data.length === 0) {
        return DOWNLOAD_FORMS;
      }

      return data.map((row: Record<string, unknown>, idx: number) => {
        const catObj = row.category as { name?: string } | null;
        const categoryName = catObj?.name || 'แบบฟอร์ม';

        return {
          id: (row.id as string) || `doc-${idx}`,
          title: (row.name as string) || '',
          desc: `หมวดหมู่: ${categoryName}`,
          size: (row.size as string) || 'PDF',
          type: 'PDF'
        };
      });
    } catch {
      return DOWNLOAD_FORMS;
    }
  }
};
