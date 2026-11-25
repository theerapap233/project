import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface ParsedScholarshipPdf {
  title?: string;
  amount?: string;
  totalSlots?: number;
  minGPAX?: number;
  targetYears?: string[];
  scope?: 'internal' | 'external';
  term?: string;
  startDate?: string;
  deadline?: string;
  description?: string;
  requirements?: string[];
  documents?: string[];
  fundingSource?: string;
}

const VALID_YEARS = ['ปี 1', 'ปี 2', 'ปี 3', 'ปี 4'];

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error || new Error('อ่านไฟล์ PDF ไม่สำเร็จ'));
    reader.readAsDataURL(file);
  });

const normalizeParsedData = (raw: Record<string, unknown>): ParsedScholarshipPdf => {
  const targetYearsRaw = Array.isArray(raw.targetYears) ? raw.targetYears : [];
  const targetYears = targetYearsRaw
    .map(y => String(y).trim())
    .filter(y => VALID_YEARS.includes(y));

  const requirements = Array.isArray(raw.requirements)
    ? raw.requirements.map(r => String(r).trim()).filter(Boolean)
    : undefined;

  const documents = Array.isArray(raw.documents)
    ? raw.documents.map(d => String(d).trim()).filter(Boolean)
    : undefined;

  const minGpaxNum = Number(raw.minGPAX);
  const totalSlotsNum = Number(raw.totalSlots);

  const normalizeDate = (val: unknown): string | undefined => {
    if (typeof val !== 'string') return undefined;
    const trimmed = val.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined;
    const year = parseInt(trimmed.slice(0, 4), 10);
    if (year > 2400) {
      return `${year - 543}${trimmed.slice(4)}`;
    }
    return trimmed;
  };

  return {
    title: typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : undefined,
    amount: typeof raw.amount === 'string' && raw.amount.trim() ? raw.amount.trim() : undefined,
    totalSlots: Number.isFinite(totalSlotsNum) && totalSlotsNum >= 1 ? Math.round(totalSlotsNum) : undefined,
    minGPAX: Number.isFinite(minGpaxNum) && minGpaxNum >= 0 && minGpaxNum <= 4 ? minGpaxNum : undefined,
    targetYears: targetYears.length > 0 ? targetYears : undefined,
    scope: raw.scope === 'external' ? 'external' : raw.scope === 'internal' ? 'internal' : undefined,
    term: typeof raw.term === 'string' && raw.term.trim() ? raw.term.trim() : undefined,
    startDate: normalizeDate(raw.startDate),
    deadline: normalizeDate(raw.deadline),
    description: typeof raw.description === 'string' && raw.description.trim() ? raw.description.trim() : undefined,
    requirements: requirements && requirements.length > 0 ? requirements : undefined,
    documents: documents && documents.length > 0 ? documents : undefined,
    fundingSource: typeof raw.fundingSource === 'string' && raw.fundingSource.trim() ? raw.fundingSource.trim() : undefined
  };
};

const EXTRACTION_PROMPT = `คุณคือผู้ช่วยอ่านประกาศทุนการศึกษาภาษาไทย/อังกฤษของภาควิชาคณิตศาสตร์ มจพ.
จงอ่านเอกสาร PDF ที่แนบมาและดึงข้อมูลสำคัญออกมาเป็น JSON ตามโครงสร้างนี้เท่านั้น:
{
  "title": "ชื่อทุนการศึกษา",
  "amount": "มูลค่าทุน เช่น 20,000 บาท / ภาคการศึกษา",
  "totalSlots": 10,
  "minGPAX": 2.50,
  "targetYears": ["ปี 1", "ปี 2", "ปี 3", "ปี 4"],
  "scope": "internal หรือ external",
  "term": "ภาคการศึกษาที่ 1 หรือ ภาคการศึกษาที่ 2 หรือ ภาคการศึกษาที่ 3 (ฤดูร้อน) หรือ ตลอดปีการศึกษา",
  "startDate": "YYYY-MM-DD (ค.ศ.) หรือค่าว่าง",
  "deadline": "YYYY-MM-DD (ค.ศ.) หรือค่าว่าง",
  "description": "สรุปวัตถุประสงค์และรายละเอียดสำคัญของทุน 2-4 ประโยค",
  "requirements": ["คุณสมบัติข้อ 1", "คุณสมบัติข้อ 2"],
  "documents": ["เอกสารที่ต้องใช้ 1", "เอกสารที่ต้องใช้ 2"],
  "fundingSource": "ชื่อหน่วยงาน/แหล่งทุนสนับสนุน"
}`;

export const scholarshipAiService = {
  async parseScholarshipPdf(file: File): Promise<{
    ok: boolean;
    data?: ParsedScholarshipPdf;
    error?: string;
  }> {
    try {
      const pdfBase64 = await fileToBase64(file);

      // 1) ลองเรียก Supabase Edge Function ก่อน
      if (isSupabaseConfigured()) {
        const { data: fnData, error: fnError } = await supabase.functions.invoke('parse-scholarship-pdf', {
          body: { pdfBase64, fileName: file.name }
        });

        if (!fnError && fnData?.ok && fnData?.data) {
          return {
            ok: true,
            data: normalizeParsedData(fnData.data as Record<string, unknown>)
          };
        }
      }

      // 2) Fallback: ถ้ามีการตั้งค่า VITE_GEMINI_API_KEY ใน .env ให้เรียก Gemini โดยตรง
      const clientGeminiKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
      if (clientGeminiKey) {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${clientGeminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { inlineData: { mimeType: 'application/pdf', data: pdfBase64 } },
                    { text: EXTRACTION_PROMPT }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: 'application/json'
              }
            })
          }
        );

        if (res.ok) {
          const json = await res.json() as {
            candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
          };
          const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
          const parsed = JSON.parse(cleaned) as Record<string, unknown>;
          return { ok: true, data: normalizeParsedData(parsed) };
        }

        const errJson = await res.json().catch(() => null) as { error?: { message?: string } } | null;
        return {
          ok: false,
          error: `AI ตอบกลับไม่สำเร็จ (${res.status}): ${errJson?.error?.message || 'กรุณาลองใหม่อีกครั้ง'}`
        };
      }

      return {
        ok: false,
        error: 'ยังไม่ได้ตั้งค่า AI (GEMINI_API_KEY) ใน Supabase Edge Function หรือ .env — แนบไฟล์ PDF ให้แล้ว สามารถกรอกข้อมูลเพิ่มเติมได้'
      };
    } catch (err) {
      console.error('parseScholarshipPdf error:', err);
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'ไม่สามารถวิเคราะห์ไฟล์ PDF ด้วย AI ได้'
      };
    }
  }
};
