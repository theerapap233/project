import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ApplicationStatus } from '../../types/application';

export type Decision = 'approved' | 'rejected';

interface DecisionPickerProps {
  status: ApplicationStatus;
  onChange: (decision: Decision) => void;
  applicantName?: string;
}

const OPTIONS: { value: Decision; label: string; icon: string; color: string }[] = [
  { value: 'approved', label: 'อนุมัติทุน', icon: '✓', color: '#047857' },
  { value: 'rejected', label: 'ไม่ผ่าน', icon: '✕', color: '#b91c1c' }
];

const MENU_WIDTH = 180;

/**
 * ปุ่มเลือกผลพิจารณาแบบเมนู (อนุมัติ / ไม่ผ่าน) มีจุดบอกตัวเลือกปัจจุบัน
 * เมนูถูก render ผ่าน portal เพราะตารางใบสมัครมี overflow: hidden
 */
export const DecisionPicker: React.FC<DecisionPickerProps> = ({ status, onChange, applicantName }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = OPTIONS.find(o => o.value === status) || null;

  const updatePosition = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
    const menuHeight = 104;
    const below = rect.bottom + 6;
    const top = below + menuHeight > window.innerHeight ? rect.top - menuHeight - 6 : below;
    setPos({ top, left });
  };

  useLayoutEffect(() => {
    if (open) updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
        buttonRef.current?.focus();
      }
    };
    // ใช้ capture เพราะเซลล์ในตารางมี stopPropagation อยู่
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('touchstart', onPointerDown, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onPointerDown, true);
      document.removeEventListener('touchstart', onPointerDown, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const choose = (value: Decision) => {
    setOpen(false);
    if (value !== status) onChange(value);
  };

  const buttonStyle: React.CSSProperties = current
    ? {
        border: `1px solid ${current.value === 'approved' ? '#a7f3d0' : '#fecaca'}`,
        background: current.value === 'approved' ? '#ecfdf5' : '#fef2f2',
        color: current.color
      }
    : {
        border: '1px solid var(--border-light, #e2e8f0)',
        background: 'var(--surface-card, #ffffff)',
        color: 'var(--navy-800, #1e293b)'
      };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={applicantName ? `เลือกผลพิจารณาของ ${applicantName}` : 'เลือกผลพิจารณา'}
        style={{
          height: 32,
          minWidth: 104,
          padding: '0 10px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          borderRadius: 6,
          fontSize: '0.8rem',
          fontWeight: 700,
          fontFamily: 'inherit',
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          ...buttonStyle
        }}
      >
        <span>{current ? `${current.icon} ${current.label}` : 'เลือกผล'}</span>
        <span aria-hidden="true" style={{ fontSize: '0.65rem', opacity: 0.7 }}>▼</span>
      </button>

      {open && pos && createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label="ผลการพิจารณา"
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            width: MENU_WIDTH,
            zIndex: 2000,
            padding: 6,
            borderRadius: 10,
            background: 'var(--surface-card, #ffffff)',
            border: '1px solid var(--border-light, #e2e8f0)',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.16)'
          }}
        >
          {OPTIONS.map(option => {
            const selected = option.value === status;
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => choose(option.value)}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-alt, #f1f5f9)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 10px',
                  border: 'none',
                  borderRadius: 7,
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.86rem',
                  fontWeight: selected ? 700 : 500,
                  color: 'var(--text-main, #0f172a)',
                  textAlign: 'left'
                }}
              >
                {/* จุดบอกตัวเลือกปัจจุบัน */}
                <span aria-hidden="true" style={{ width: 8, display: 'inline-flex', justifyContent: 'center' }}>
                  {selected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: option.color }} />}
                </span>
                <span aria-hidden="true" style={{ width: 16, textAlign: 'center', color: option.color, fontWeight: 700 }}>
                  {option.icon}
                </span>
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
};
