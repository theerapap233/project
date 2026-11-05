import { DownloadDoc, FaqItem, SiteSettings } from '../types/common';
import { Scholarship } from '../types/scholarship';
import { formatThaiDate } from '../utils/dateFormatter';

/**
 * ฐานความรู้ของ AI Chatbot
 * ดึงข้อมูลจริงจาก context (ทุน, FAQ, เอกสาร, ข้อมูลติดต่อ) เพื่อให้คำตอบตรงกับเว็บเสมอ
 */
export interface ChatbotKnowledge {
  scholarships: Scholarship[];
  faqs: FaqItem[];
  downloads: DownloadDoc[];
  settings: SiteSettings;
  userName?: string | null;
}

export interface ChatbotReply {
  text: string;
  suggestions: string[];
}

const DEFAULT_SUGGESTIONS = [
  'มีทุนอะไรเปิดรับบ้าง',
  'เกณฑ์การสมัครทุนเรียนดี',
  'เอกสารที่ต้องใช้',
  'ติดต่อเจ้าหน้าที่'
];

const STATUS_LABEL: Record<Scholarship['status'], string> = {
  open: 'เปิดรับสมัคร',
  closing_soon: 'ใกล้ปิดรับ',
  closed: 'ปิดรับแล้ว'
};

/** ตัดช่องว่างและเครื่องหมายออก เพราะภาษาไทยเขียนติดกันได้ */
const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[\s\u200b]+/g, '')
    .replace(/[-.,!?()[\]{}:;/'"“”‘’\\–—+*%]/g, '');

const hasAny = (text: string, keywords: string[]): number =>
  keywords.reduce((count, keyword) => (text.includes(normalize(keyword)) ? count + 1 : count), 0);

/** ให้คะแนนตามความยาวคำสำคัญ เพื่อให้คำเฉพาะเจาะจงชนะคำกว้าง ๆ */
const keywordScore = (text: string, keywords: string[]): number =>
  keywords.reduce((total, keyword) => {
    const token = normalize(keyword);
    return text.includes(token) ? total + token.length : total;
  }, 0);

const bigramSet = (value: string): Set<string> => {
  const set = new Set<string>();
  for (let i = 0; i < value.length - 1; i += 1) set.add(value.slice(i, i + 2));
  return set;
};

const similarity = (a: string, b: string): number => {
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const first = bigramSet(a);
  const second = bigramSet(b);
  let overlap = 0;
  first.forEach(pair => {
    if (second.has(pair)) overlap += 1;
  });
  return (2 * overlap) / (first.size + second.size);
};

const formatScholarshipLine = (scholarship: Scholarship): string => {
  const criteria = [
    `GPAX ≥ ${scholarship.minGPAX.toFixed(2)}`,
    `รับ ${scholarship.remainingSlots}/${scholarship.totalSlots} ทุน`,
    `${STATUS_LABEL[scholarship.status]} ถึง ${formatThaiDate(scholarship.deadline)}`
  ];
  return `• ${scholarship.title}\n   ${scholarship.amount} | ${criteria.join(' | ')}`;
};

const openScholarships = (kb: ChatbotKnowledge): Scholarship[] =>
  kb.scholarships.filter(scholarship => scholarship.status !== 'closed');

const findScholarship = (text: string, kb: ChatbotKnowledge): Scholarship | undefined =>
  kb.scholarships.find(scholarship => {
    if (normalize(scholarship.code) && text.includes(normalize(scholarship.code))) return true;
    return similarity(text, normalize(scholarship.title)) >= 0.42;
  });

const categoryKeywords: { category: Scholarship['category']; keywords: string[] }[] = [
  { category: 'academic', keywords: ['เรียนดี', 'วิชาการ', 'ผลการเรียน', 'สร้างชื่อเสียง', 'วิจัย'] },
  { category: 'need', keywords: ['ขาดแคลน', 'ทุนทรัพย์', 'รายได้น้อย', 'ยากจน', 'เงินกู้'] },
  { category: 'work', keywords: ['ผู้ช่วยสอน', 'ta', 'งานพิเศษ', 'ช่วยงาน'] },
  { category: 'alumni', keywords: ['ศิษย์เก่า', 'ศิษย์เก่า', 'สมาคม', 'มูลนิธิ'] },
  { category: 'activity', keywords: ['จิตสาธารณะ', 'จิตอาสา', 'กิจกรรม', 'volunteer'] }
];

const contactText = (kb: ChatbotKnowledge): string => {
  const { settings } = kb;
  return [
    'ช่องทางติดต่อเจ้าหน้าที่ทุนการศึกษา',
    '',
    `• โทร: ${settings.contactPhone || '-'}`,
    `• อีเมล: ${settings.contactEmail || '-'}`,
    `• ที่อยู่: ${settings.contactAddress || '-'}`,
    settings.facebookUrl ? `• Facebook: ${settings.facebookUrl}` : '',
    '',
    'เวลาทำการ จันทร์ - ศุกร์ 08:30 - 16:30 น.'
  ]
    .filter(Boolean)
    .join('\n');
};

interface Intent {
  /** ค่ามาก = ได้ความสำคัญก่อน เมื่อคำถามเข้าหลายเจตนาพร้อมกัน */
  priority: number;
  keywords: string[];
  reply: (kb: ChatbotKnowledge) => string;
  suggestions?: string[];
}

const INTENTS: Intent[] = [
  {
    priority: 100,
    keywords: ['มีทุนอะไร', 'ทุนอะไรบ้าง', 'ทุนที่เปิด', 'ทุนเปิดรับ', 'รายการทุน', 'ทุนทั้งหมด', 'ดูทุน', 'มีทุน'],
    reply: kb => {
      const list = openScholarships(kb);
      if (list.length === 0) {
        return 'ขณะนี้ยังไม่มีทุนที่เปิดรับสมัครครับ ประกาศทุนรอบถัดไปจะแจ้งในส่วน "ข่าวสารและประกาศ" ของเว็บไซต์';
      }
      return [
        `ขณะนี้มีทุนที่เปิดรับ ${list.length} ทุนครับ`,
        '',
        ...list.map(formatScholarshipLine),
        '',
        'ต้องการรายละเอียดทุนใด พิมพ์ชื่อทุน หรือกดปุ่ม "ทุนการศึกษา" เพื่อดูรายการเต็มได้เลยครับ'
      ].join('\n');
    },
    suggestions: ['เกณฑ์การสมัคร', 'เอกสารที่ต้องใช้', 'สมัครอย่างไร']
  },
  {
    priority: 60,
    keywords: ['เกณฑ์', 'คุณสมบัติ', 'เงื่อนไข', 'ต้องมี', 'เกรด', 'gpax', 'รายได้', 'ชั่วโมง', 'จิตอาสา', 'ชั้นปี', 'สาขา', 'ใครสมัครได้'],
    reply: kb => [
      'เกณฑ์คุณสมบัติของแต่ละทุนเป็นดังนี้ครับ',
      '',
      ...kb.scholarships.map(scholarship => {
        const parts = [`GPAX ไม่ต่ำกว่า ${scholarship.minGPAX.toFixed(2)}`];
        if (scholarship.maxFamilyIncome) parts.push(`รายได้ครอบครัวไม่เกิน ${scholarship.maxFamilyIncome.toLocaleString('th-TH')} บาท/ปี`);
        if (scholarship.minVolunteerHours) parts.push(`จิตอาสาอย่างน้อย ${scholarship.minVolunteerHours} ชั่วโมง`);
        parts.push(`เปิดรับ ${scholarship.targetYears.join(', ')}`);
        return `• ${scholarship.title}\n   ${parts.join(' | ')}`;
      }),
      '',
      'หาก GPAX ยังไม่ถึงเกณฑ์ทุนเรียนดี สามารถพิจารณาทุนขาดแคลนทุนทรัพย์หรือทุนจิตสาธารณะได้ครับ'
    ].join('\n'),
    suggestions: ['มีทุนอะไรเปิดรับบ้าง', 'เอกสารที่ต้องใช้']
  },
  {
    priority: 55,
    keywords: ['หมดเขต', 'เดดไลน์', 'กำหนดส่ง', 'ปิดรับ', 'วันสุดท้าย', 'ภายในวันที่', 'deadline', 'ใกล้ปิด'],
    reply: kb => {
      const list = [...openScholarships(kb)].sort((a, b) => a.deadline.localeCompare(b.deadline));
      if (list.length === 0) return 'ขณะนี้ยังไม่มีทุนที่เปิดรับสมัครครับ';
      return [
        'กำหนดปิดรับสมัคร เรียงตามวันที่ใกล้ที่สุดครับ',
        '',
        ...list.map(scholarship => `• ${scholarship.title}\n   ปิดรับ ${formatThaiDate(scholarship.deadline)} (${STATUS_LABEL[scholarship.status]})`),
        '',
        'แนะนำให้ยื่นล่วงหน้าอย่างน้อย 3 วัน เพื่อความปลอดภัยของเอกสารครับ'
      ].join('\n');
    },
    suggestions: ['สมัครอย่างไร', 'เอกสารที่ต้องใช้']
  },
  {
    priority: 50,
    keywords: ['เอกสาร', 'แบบฟอร์ม', 'ดาวน์โหลด', 'ฟอร์ม', 'pdf', 'หลักฐาน', 'ไฟล์'],
    reply: kb => {
      if (kb.downloads.length === 0) {
        return 'ขณะนี้ยังไม่มีเอกสารให้ดาวน์โหลดในระบบครับ สามารถติดต่อเจ้าหน้าที่เพื่อขอรับแบบฟอร์มได้';
      }
      return [
        'เอกสารและแบบฟอร์มที่ดาวน์โหลดได้จากเว็บไซต์ครับ',
        '',
        ...kb.downloads.map(doc => `• ${doc.title} (${doc.type}${doc.size ? ` ${doc.size}` : ''})\n   ${doc.desc}`),
        '',
        'ไปที่เมนู "เอกสารดาวน์โหลด" เพื่อกดดาวน์โหลดได้เลยครับ'
      ].join('\n');
    },
    suggestions: ['มีทุนอะไรเปิดรับบ้าง', 'ติดต่อเจ้าหน้าที่']
  },
  {
    priority: 40,
    keywords: ['สมัครยังไง', 'วิธีสมัคร', 'ขั้นตอน', 'ยื่นสมัคร', 'สมัคร', 'ใบสมัคร', 'กรอก'],
    reply: kb => {
      const first = openScholarships(kb)[0];
      return [
        'ขั้นตอนการสมัครขอรับทุนการศึกษา',
        '',
        '1. เข้าสู่ระบบด้วยรหัสนักศึกษา (หรือสมัครสมาชิกใหม่)',
        '2. เปิดเมนู "ทุนการศึกษา" เลือกทุนที่ต้องการ แล้วกด "สมัครขอรับทุน"',
        '3. กรอกข้อมูลในแบบฟอร์มออนไลน์ให้ครบถ้วน',
        '4. แนบไฟล์เอกสารประกอบ (Transcript, บัตรประชาชน, หลักฐานรายได้)',
        '5. ตรวจสอบข้อมูลและกดส่งใบสมัคร ระบบจะออก "รหัสติดตาม" ให้เก็บไว้',
        '',
        first
          ? `ทุนที่เปิดรับเร็วที่สุด: ${first.title} ปิดรับ ${formatThaiDate(first.deadline)}`
          : 'ขณะนี้ยังไม่มีทุนที่เปิดรับสมัครครับ',
        '',
        'เจ้าหน้าที่จะติดต่อกลับตามข้อมูลที่ให้ไว้ในใบสมัครครับ'
      ].join('\n');
    },
    suggestions: ['เอกสารที่ต้องใช้', 'เกณฑ์การสมัคร']
  },
  {
    priority: 75,
    keywords: ['โอน', 'เงินเข้า', 'จ่ายเงิน', 'เบิกจ่าย', 'รับเงิน', 'สัญญารับทุน', 'เงินโอน'],
    reply: kb => [
      'การเบิกจ่ายเงินทุนการศึกษา',
      '',
      '• เงินทุนโอนเข้าบัญชีเงินฝากธนาคารกรุงไทยของนักศึกษา (บัญชีเดียวกับที่ใช้ลงทะเบียนเรียน)',
      '• ใช้เวลาประมาณ 15 - 30 วันทำการ หลังจัดทำสัญญารับทุนเสร็จสิ้น',
      '• นักศึกษาต้องส่งรายงานความก้าวหน้าและผลการเรียนตามที่กำหนด จึงจะได้รับการเบิกจ่ายงวดถัดไป',
      '',
      contactText(kb)
    ].join('\n'),
    suggestions: ['ติดต่อเจ้าหน้าที่', 'เอกสารที่ต้องใช้']
  },
  {
    priority: 70,
    keywords: ['เงิน', 'มูลค่า', 'เท่าไหร่', 'เท่าไร', 'จำนวนเงิน', 'บาท', 'เบิก', 'ค่าตอบแทน', 'ได้เท่าไหร่'],
    reply: kb => [
      'มูลค่าทุนในแต่ละประเภทครับ',
      '',
      ...kb.scholarships.map(scholarship => `• ${scholarship.title}\n   ${scholarship.amount}`),
      '',
      'เงินทุนจะโอนเข้าบัญชีเงินฝากธนาคารกรุงไทยของนักศึกษา หลังจัดทำสัญญารับทุนเรียบร้อยครับ'
    ].join('\n'),
    suggestions: ['เงินทุนโอนเมื่อไหร่', 'เอกสารที่ต้องใช้']
  },
  {
    priority: 80,
    keywords: ['สัมภาษณ์', 'นัดหมาย', 'วันสัมภาษณ์', 'สอบสัมภาษณ์'],
    reply: kb => [
      'การสัมภาษณ์ทุนการศึกษา',
      '',
      '• เจ้าหน้าที่จะประกาศรายชื่อผู้ผ่านการคัดกรองเอกสารในส่วน "ข่าวสารและประกาศ"',
      '• ผู้มีสิทธิ์สัมภาษณ์จะได้รับแจ้งวัน เวลา และห้องสัมภาษณ์จากเจ้าหน้าที่',
      '• สถานที่: ห้องประชุมภาควิชาคณิตศาสตร์ ชั้น 7 อาคาร 78',
      '',
      'แนะนำให้เตรียม Transcript และหลักฐานรายได้ไปในวันสัมภาษณ์ด้วยครับ',
      '',
      contactText(kb)
    ].join('\n'),
    suggestions: ['ติดต่อเจ้าหน้าที่']
  },
  {
    priority: 85,
    keywords: ['สถานะ', 'ผลการพิจารณา', 'ติดตาม', 'อนุมัติ', 'ผ่านการคัดเลือก', 'ประกาศผล'],
    reply: () => [
      'การติดตามผลการสมัครทุน',
      '',
      'ระบบตรวจสอบสถานะออนไลน์ถูกปิดใช้งานแล้วครับ ตอนนี้เจ้าหน้าที่จะติดต่อกลับตามเบอร์โทรหรืออีเมลที่ให้ไว้ในใบสมัคร',
      '',
      'สิ่งที่ควรเตรียมเมื่อสอบถามเจ้าหน้าที่',
      '• รหัสติดตาม (Tracking ID) ที่ได้รับหลังส่งใบสมัคร',
      '• รหัสนักศึกษา และชื่อ-นามสกุล',
      '• ชื่อทุนที่สมัคร'
    ].join('\n'),
    suggestions: ['ติดต่อเจ้าหน้าที่', 'มีทุนอะไรเปิดรับบ้าง']
  },
  {
    priority: 30,
    keywords: ['เข้าสู่ระบบ', 'สมัครสมาชิก', 'รหัสผ่าน', 'บัญชี', 'login', 'ล็อกอิน', 'ลืมรหัส'],
    reply: () => [
      'การใช้งานบัญชีนักศึกษา',
      '',
      '• เข้าสู่ระบบด้วยรหัสนักศึกษาและรหัสผ่านที่สมัครไว้',
      '• หากยังไม่มีบัญชี ให้กด "สมัครสมาชิก" ในหน้าต่างเข้าสู่ระบบ',
      '• ลืมรหัสผ่าน: ติดต่อเจ้าหน้าที่เพื่อรีเซ็ตให้ครับ',
      '',
      'ข้อมูลบัญชีถูกจัดเก็บอย่างปลอดภัยบนระบบฐานข้อมูลของภาควิชา'
    ].join('\n'),
    suggestions: ['ติดต่อเจ้าหน้าที่']
  },
  {
    priority: 20,
    keywords: ['ติดต่อ', 'เบอร์', 'โทร', 'อีเมล', 'email', 'ที่อยู่', 'เจ้าหน้าที่', 'สอบถาม', 'facebook', 'ไลน์'],
    reply: kb => contactText(kb),
    suggestions: ['มีทุนอะไรเปิดรับบ้าง']
  },
  {
    priority: 65,
    keywords: ['กี่ทุน', 'จำนวนทุน', 'มีกี่', 'ที่ว่าง', 'เหลือ'],
    reply: kb => [
      `ขณะนี้มีทุนทั้งหมด ${kb.scholarships.length} ทุน และเปิดรับ ${openScholarships(kb).length} ทุนครับ`,
      '',
      ...kb.scholarships.map(scholarship => `• ${scholarship.title}: รับ ${scholarship.totalSlots} ทุน (เหลือ ${scholarship.remainingSlots})`)
    ].join('\n'),
    suggestions: ['มีทุนอะไรเปิดรับบ้าง']
  },
  {
    priority: 95,
    keywords: ['กยศ', 'กรอ', 'กู้ยืม'],
    reply: () => [
      'นักศึกษาที่กู้ยืม กยศ. / กรอ. สามารถสมัครขอรับทุนของภาควิชาได้ครับ',
      '',
      '• คณะกรรมการจะพิจารณาความจำเป็นและความเหมาะสมเป็นรายกรณี',
      '• ทุนช่วยเหลือขาดแคลนทุนทรัพย์และทุนผู้ช่วยสอน (TA) สามารถรับควบคู่กับเงินกู้ได้ตามระเบียบมหาวิทยาลัย'
    ].join('\n'),
    suggestions: ['เกณฑ์การสมัคร', 'มีทุนอะไรเปิดรับบ้าง']
  },
  {
    priority: 90,
    keywords: ['หลายทุน', 'มากกว่า 1', 'ซ้ำซ้อน', 'รับพร้อมกัน'],
    reply: () => [
      'การสมัครหรือรับทุนมากกว่า 1 ประเภท',
      '',
      '• ยื่นสมัครได้มากกว่า 1 ประเภท',
      '• เมื่อผ่านการพิจารณา คณะกรรมการจะจัดสรรทุนหลักให้เพียง 1 ทุน',
      '• ยกเว้นทุนผู้ช่วยสอน (TA) และทุนสนับสนุนการแข่งขัน ซึ่งรับร่วมกับทุนอื่นได้'
    ].join('\n'),
    suggestions: ['เกณฑ์การสมัคร']
  }
];

const GREETING_KEYWORDS = ['สวัสดี', 'ดีครับ', 'ดีค่ะ', 'หวัดดี', 'hello', 'hi', 'hey'];
const THANKS_KEYWORDS = ['ขอบคุณ', 'ขอบใจ', 'thank', 'thanks', 'thx'];
const BYE_KEYWORDS = ['ลาก่อน', 'บาย', 'goodbye', 'bye'];

const greetingReply = (kb: ChatbotKnowledge): ChatbotReply => ({
  text: [
    `สวัสดีครับ${kb.userName ? ` คุณ${kb.userName}` : ''} ผมเป็นผู้ช่วย AI ประจำระบบทุนการศึกษาภาควิชาคณิตศาสตร์`,
    '',
    'ถามได้เลยครับ เช่น เกณฑ์การสมัคร เอกสารที่ต้องใช้ กำหนดปิดรับ หรือข้อมูลติดต่อเจ้าหน้าที่'
  ].join('\n'),
  suggestions: DEFAULT_SUGGESTIONS
});

const fallbackReply = (kb: ChatbotKnowledge, matchedScholarship?: Scholarship): ChatbotReply => {
  if (matchedScholarship) {
    const scholarship = matchedScholarship;
    return {
      text: [
        scholarship.title,
        '',
        `• มูลค่า: ${scholarship.amount}`,
        `• จำนวน: รับ ${scholarship.totalSlots} ทุน (เหลือ ${scholarship.remainingSlots})`,
        `• สถานะ: ${STATUS_LABEL[scholarship.status]} ถึง ${formatThaiDate(scholarship.deadline)}`,
        `• เกณฑ์ขั้นต่ำ: GPAX ${scholarship.minGPAX.toFixed(2)}`,
        `• เปิดรับ: ${scholarship.targetYears.join(', ')}`,
        `• สาขา: ${scholarship.targetMajors.join(', ')}`,
        '',
        'เอกสารที่ต้องใช้',
        ...scholarship.documents.map(doc => `• ${doc}`),
        '',
        'คุณสมบัติผู้สมัคร',
        ...scholarship.requirements.map(req => `• ${req}`)
      ].join('\n'),
      suggestions: ['สมัครอย่างไร', 'ทุนอื่นที่เปิดรับ', 'ติดต่อเจ้าหน้าที่']
    };
  }

  return {
    text: [
      'ขออภัยครับ ผมยังไม่พบคำตอบที่ตรงกับคำถามนี้ในฐานข้อมูลของเว็บไซต์',
      '',
      'ลองถามใหม่ด้วยคำสำคัญ เช่น "ทุนที่เปิดรับ", "เกณฑ์การสมัคร", "เอกสารที่ต้องใช้", "กำหนดปิดรับ" หรือ "ติดต่อเจ้าหน้าที่"',
      '',
      `หรือติดต่อเจ้าหน้าที่โดยตรงที่ ${kb.settings.contactPhone || kb.settings.contactEmail || '-'} ครับ`
    ].join('\n'),
    suggestions: DEFAULT_SUGGESTIONS
  };
};

/** หาคำถาม FAQ ที่ใกล้เคียงที่สุดจากคำถามของผู้ใช้ */
const bestFaq = (text: string, faqs: FaqItem[]): { faq: FaqItem; score: number } | null => {
  let best: { faq: FaqItem; score: number } | null = null;
  faqs.forEach(faq => {
    const questionScore = similarity(text, normalize(faq.question));
    const answerScore = similarity(text, normalize(faq.answer)) * 0.6;
    const score = Math.max(questionScore, answerScore);
    if (!best || score > best.score) best = { faq, score };
  });
  return best;
};

/**
 * สร้างคำตอบจากคำถามของผู้ใช้ โดยเลือกจาก
 * 1) คำทักทาย / ขอบคุณ  2) FAQ ที่ใกล้เคียง  3) เจตนาคำถามที่รู้จัก  4) รายละเอียดทุน  5) คำตอบสำรอง
 */
export const generateChatbotReply = (question: string, kb: ChatbotKnowledge): ChatbotReply => {
  const text = question.trim();
  if (!text) {
    return {
      text: 'พิมพ์คำถามที่ต้องการทราบได้เลยครับ',
      suggestions: DEFAULT_SUGGESTIONS
    };
  }

  const normalized = normalize(text);

  if (hasAny(normalized, THANKS_KEYWORDS) > 0 && normalized.length <= 20) {
    return {
      text: 'ยินดีครับ หากมีคำถามเพิ่มเติมเกี่ยวกับทุนการศึกษา ถามได้ตลอดเลยครับ',
      suggestions: DEFAULT_SUGGESTIONS
    };
  }

  if (hasAny(normalized, BYE_KEYWORDS) > 0 && normalized.length <= 15) {
    return {
      text: 'ขอบคุณที่ใช้งานครับ ขอให้โชคดีกับการสมัครทุนนะครับ',
      suggestions: DEFAULT_SUGGESTIONS
    };
  }

  if (hasAny(normalized, GREETING_KEYWORDS) > 0 && normalized.length <= 20) {
    return greetingReply(kb);
  }

  const faqMatch = bestFaq(normalized, kb.faqs);
  if (faqMatch && faqMatch.score >= 0.5) {
    return {
      text: faqMatch.faq.answer,
      suggestions: DEFAULT_SUGGESTIONS
    };
  }

  const matchedIntents = INTENTS.filter(intent => keywordScore(normalized, intent.keywords) > 0);
  const bestIntent = [...matchedIntents].sort((a, b) => b.priority - a.priority)[0];

  if (bestIntent) {
    return {
      text: bestIntent.reply(kb),
      suggestions: bestIntent.suggestions ?? DEFAULT_SUGGESTIONS
    };
  }

  const matchedScholarship = findScholarship(normalized, kb);

  const categoryHits = categoryKeywords
    .map(entry => ({ entry, score: hasAny(normalized, entry.keywords) }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (categoryHits.length > 0) {
    const category = categoryHits[0].entry.category;
    const list = kb.scholarships.filter(scholarship => scholarship.category === category);
    if (list.length > 0) {
      return {
        text: [
          `ทุนหมวด "${list[0].categoryName}" มี ${list.length} ทุนครับ`,
          '',
          ...list.map(formatScholarshipLine),
          '',
          'ต้องการรายละเอียดเอกสารหรือคุณสมบัติของทุนใด พิมพ์ชื่อทุนนั้นได้เลยครับ'
        ].join('\n'),
        suggestions: ['เกณฑ์การสมัคร', 'เอกสารที่ต้องใช้', 'สมัครอย่างไร']
      };
    }
  }

  if (faqMatch && faqMatch.score >= 0.32) {
    return {
      text: faqMatch.faq.answer,
      suggestions: DEFAULT_SUGGESTIONS
    };
  }

  return fallbackReply(kb, matchedScholarship);
};
