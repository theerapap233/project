const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const jsonResponse = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });

const EXTRACTION_PROMPT = `คุณคือผู้ช่วยอ่านประกาศทุนการศึกษาภาษาไทย/อังกฤษของภาควิชาคณิตศาสตร์ มจพ.
จงอ่านเอกสาร PDF ที่แนบมาและดึงข้อมูลสำคัญออกมาเป็น JSON ตามโครงสร้างนี้เท่านั้น:
{
  "title": "ชื่อทุนการศึกษา (กระชับ ชัดเจน)",
  "amount": "มูลค่าทุน เช่น 20,000 บาท / ภาคการศึกษา หรือ ตามประกาศ",
  "totalSlots": 10,
  "minGPAX": 2.50,
  "targetYears": ["ปี 1", "ปี 2", "ปี 3", "ปี 4"],
  "scope": "internal หรือ external (internal = ทุนภายในภาควิชา/คณะ/มจพ., external = ทุนภายนอก/บริษัท/มูลนิธิ/ศิษย์เก่า)",
  "term": "ภาคการศึกษาที่ 1 หรือ ภาคการศึกษาที่ 2 หรือ ภาคการศึกษาที่ 3 (ฤดูร้อน) หรือ ตลอดปีการศึกษา",
  "startDate": "YYYY-MM-DD (ค.ศ.) หรือค่าว่างถ้าไม่ระบุ",
  "deadline": "YYYY-MM-DD (ค.ศ.) ถ้าในเอกสารเป็น พ.ศ. ให้ลบ 543 เช่น 2569 -> 2026 หรือค่าว่างถ้าไม่ระบุ",
  "description": "สรุปวัตถุประสงค์และรายละเอียดสำคัญของทุน 2-4 ประโยค",
  "requirements": ["คุณสมบัติข้อ 1", "คุณสมบัติข้อ 2"],
  "documents": ["เอกสารที่ต้องใช้ 1", "เอกสารที่ต้องใช้ 2"],
  "fundingSource": "ชื่อหน่วยงาน/แหล่งทุนสนับสนุน"
}
หมายเหตุ:
- ถ้าไม่พบจำนวนทุน ให้ใช้ 10
- ถ้าไม่พบ GPAX ขั้นต่ำ ให้ใช้ 2.00
- ถ้าไม่พบชั้นปี ให้ใช้ ["ปี 1", "ปี 2", "ปี 3", "ปี 4"]
- ห้ามใส่ markdown code block ให้ตอบเป็น JSON ล้วนเท่านั้น`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')?.trim();
    if (!geminiApiKey) {
      return jsonResponse(503, {
        error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ใน Supabase Edge Function Secrets'
      });
    }

    const body = await req.json() as { pdfBase64?: string; fileName?: string };
    const pdfBase64 = body.pdfBase64?.trim();
    if (!pdfBase64) {
      return jsonResponse(400, { error: 'ไม่พบข้อมูลไฟล์ PDF (pdfBase64)' });
    }

    const geminiEndpoint =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${geminiApiKey}`;

    const geminiRes = await fetch(geminiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: pdfBase64
                }
              },
              {
                text: EXTRACTION_PROMPT
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      console.error('Gemini API error:', errText);
      return jsonResponse(502, { error: 'เรียกใช้ Gemini AI ไม่สำเร็จ', details: errText });
    }

    const geminiJson = await geminiRes.json() as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const rawText = geminiJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanedText);

    return jsonResponse(200, { ok: true, data: parsed });
  } catch (err) {
    console.error('parse-scholarship-pdf error:', err);
    return jsonResponse(500, {
      error: err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการวิเคราะห์ไฟล์ PDF'
    });
  }
});
