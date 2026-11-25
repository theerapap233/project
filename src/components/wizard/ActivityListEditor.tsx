import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ImagePlus, Plus, Trash2, X } from 'lucide-react';
import type { ActivityEntry } from '../../types/application';
import { compressImage } from '../../utils/imageUtils';

export const MAX_ACTIVITIES = 3;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // ไฟล์ต้นฉบับไม่เกิน 10 MB (ระบบย่อขนาดก่อนบันทึก)

export const createEmptyActivity = (): ActivityEntry => ({
  name: '',
  role: '',
  detail: '',
  photoBase64: null,
  photoName: ''
});

/** ตัดกิจกรรมที่ว่างทั้งรายการออก และตัดช่องว่างหัวท้าย */
export const cleanActivityList = (list: ActivityEntry[] | undefined): ActivityEntry[] =>
  (list || [])
    .map(a => ({
      name: (a.name || '').trim(),
      role: (a.role || '').trim(),
      detail: (a.detail || '').trim(),
      photoBase64: a.photoBase64 || null,
      photoName: a.photoName || ''
    }))
    .filter(a => a.name || a.role || a.detail || a.photoBase64);

const formatBytes = (dataUrl: string) => {
  const base64 = dataUrl.split(',')[1] || '';
  const bytes = Math.round((base64.length * 3) / 4);
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
};

interface ActivityListEditorProps {
  value: ActivityEntry[];
  onChange: (next: ActivityEntry[]) => void;
  readOnly?: boolean;
  onError?: (message: string) => void;
}

/** รายการกิจกรรม (ชื่อ บทบาท รายละเอียด รูปภาพ) สูงสุด 3 กิจกรรม ใช้ทั้งในฟอร์มสมัครและหน้าแอดมิน */
export const ActivityListEditor: React.FC<ActivityListEditorProps> = ({ value, onChange, readOnly = false, onError }) => {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [preview, setPreview] = useState<{ src: string; title: string } | null>(null);
  const fileInputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!preview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreview(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [preview]);

  const update = (index: number, patch: Partial<ActivityEntry>) => {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleFile = async (index: number, file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError?.('กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WEBP)');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onError?.('รูปภาพมีขนาดใหญ่เกิน 10 MB กรุณาเลือกรูปที่เล็กลง');
      return;
    }
    setUploadingIndex(index);
    try {
      const dataUrl = await compressImage(file, 960, 960, 0.72);
      if (!dataUrl) {
        onError?.('อ่านไฟล์รูปไม่สำเร็จ กรุณาลองรูปอื่น');
        return;
      }
      update(index, { photoBase64: dataUrl, photoName: file.name });
    } finally {
      setUploadingIndex(null);
      const input = fileInputs.current[index];
      if (input) input.value = '';
    }
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--navy-800, #1e293b)',
    marginBottom: 4
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {value.length === 0 && (
        <div style={{ padding: '16px 14px', textAlign: 'center', background: '#f8fafc', borderRadius: 10, border: '1px dashed #cbd5e1', color: 'var(--text-muted, #64748b)', fontSize: '0.84rem' }}>
          {readOnly ? 'ไม่มีข้อมูลกิจกรรม' : 'ยังไม่มีกิจกรรม กด "เพิ่มกิจกรรม" เพื่อเพิ่ม (ไม่บังคับ สูงสุด 3 กิจกรรม)'}
        </div>
      )}

      {value.map((activity, index) => (
        <div
          key={index}
          style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', background: '#ffffff' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <strong style={{ fontSize: '0.88rem', color: 'var(--math-green, #077b38)' }}>กิจกรรมที่ {index + 1}</strong>
            {!readOnly && (
              <button
                type="button"
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                title="ลบกิจกรรมนี้"
                aria-label={`ลบกิจกรรมที่ ${index + 1}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, border: '1px solid #fee2e2', background: '#fff5f5', color: '#ef4444', fontSize: '0.78rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
              >
                <Trash2 size={14} />
                <span>ลบ</span>
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
            <div>
              <label style={labelStyle}>ชื่อกิจกรรม {!readOnly && <span style={{ color: '#dc2626' }}>*</span>}</label>
              <input
                type="text"
                className="form-input-light"
                value={activity.name}
                readOnly={readOnly}
                onChange={e => update(index, { name: e.target.value })}
                placeholder="เช่น ค่ายคณิตศาสตร์สัญจร"
                maxLength={150}
              />
            </div>
            <div>
              <label style={labelStyle}>บทบาท / หน้าที่</label>
              <input
                type="text"
                className="form-input-light"
                value={activity.role}
                readOnly={readOnly}
                onChange={e => update(index, { role: e.target.value })}
                placeholder="เช่น หัวหน้าโครงการ / สมาชิก"
                maxLength={100}
              />
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={labelStyle}>รายละเอียดกิจกรรม</label>
            <textarea
              className="form-input-light"
              rows={3}
              value={activity.detail || ''}
              readOnly={readOnly}
              onChange={e => update(index, { detail: e.target.value })}
              placeholder="เช่น จัดกิจกรรมสอนคณิตศาสตร์ให้นักเรียนมัธยม 3 วัน ที่โรงเรียน..."
              maxLength={1000}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ marginTop: 10 }}>
            <label style={labelStyle}>รูปภาพกิจกรรม</label>
            {activity.photoBase64 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 10, border: '1px solid #e2e8f0', borderRadius: 10, background: '#f8fafc', flexWrap: 'wrap' }}>
                <img
                  src={activity.photoBase64}
                  alt={`รูปกิจกรรม ${activity.name || index + 1}`}
                  onClick={() => setPreview({ src: activity.photoBase64 as string, title: activity.name || `กิจกรรมที่ ${index + 1}` })}
                  title="คลิกเพื่อดูรูปขนาดใหญ่"
                  style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'zoom-in', flexShrink: 0, background: '#fff' }}
                />
                <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--navy-900, #0f172a)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={activity.photoName || ''}>
                    {activity.photoName || 'รูปกิจกรรม'}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
                    {formatBytes(activity.photoBase64)} · คลิกที่รูปเพื่อดูขนาดใหญ่
                  </div>
                  {!readOnly && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => fileInputs.current[index]?.click()}
                        style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid #cbd5e1', background: '#fff', fontSize: '0.76rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', color: 'var(--navy-800, #1e293b)' }}
                      >
                        เปลี่ยนรูป
                      </button>
                      <button
                        type="button"
                        onClick={() => update(index, { photoBase64: null, photoName: '' })}
                        style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid #fee2e2', background: '#fff5f5', fontSize: '0.76rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', color: '#ef4444' }}
                      >
                        ลบรูป
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : readOnly ? (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)' }}>ไม่มีรูปภาพ</div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputs.current[index]?.click()}
                disabled={uploadingIndex === index}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '16px 12px', borderRadius: 10, border: '1.5px dashed #94a3b8', background: '#f8fafc', color: 'var(--navy-700, #334155)', fontFamily: 'inherit', cursor: uploadingIndex === index ? 'wait' : 'pointer' }}
              >
                <ImagePlus size={22} />
                <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>
                  {uploadingIndex === index ? 'กำลังประมวลผลรูป...' : 'เลือกรูปภาพกิจกรรม'}
                </span>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748b)' }}>JPG, PNG, WEBP ไม่เกิน 10 MB</span>
              </button>
            )}
            {!readOnly && (
              <input
                ref={el => { fileInputs.current[index] = el; }}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => handleFile(index, e.target.files?.[0])}
              />
            )}
          </div>
        </div>
      ))}

      {!readOnly && value.length < MAX_ACTIVITIES && (
        <button
          type="button"
          onClick={() => onChange([...value, createEmptyActivity()])}
          style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 8, border: '1px dashed var(--math-green, #077b38)', background: 'rgba(7, 123, 56, 0.05)', color: 'var(--math-green, #077b38)', fontSize: '0.82rem', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Plus size={16} />
          <span>เพิ่มกิจกรรม ({value.length}/{MAX_ACTIVITIES})</span>
        </button>
      )}

      {/* render ผ่าน portal เพราะกล่อง modal ที่ครอบอยู่มี transform ทำให้ position: fixed ไม่ยึดกับจอ */}
      {preview && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`รูปกิจกรรม ${preview.title}`}
          onClick={() => setPreview(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(15, 23, 42, 0.82)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}
        >
          <img
            src={preview.src}
            alt={preview.title}
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: 'min(92vw, 960px)', maxHeight: '80vh', objectFit: 'contain', borderRadius: 10, background: '#fff' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#fff', fontSize: '0.9rem' }}>
            <span>{preview.title}</span>
            <span
              role="button"
              tabIndex={0}
              onClick={() => setPreview(null)}
              onKeyDown={e => { if (e.key === 'Enter') setPreview(null); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', cursor: 'pointer' }}
            >
              <X size={14} /> ปิด
            </span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
