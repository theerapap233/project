import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Printer,
  Users,
  XCircle
} from 'lucide-react';
import { Application, ApplicationStatus } from '../../types/application';

interface StudentSelectionViewProps {
  apps: Application[];
  selectedIds: Set<string>;
  onSelectionChange: (next: Set<string>) => void;
  onViewApp: (app: Application) => void;
  onPrintList: () => void;
  onPrintApplications: () => void;
  renderStatusBadge: (status: ApplicationStatus) => React.ReactNode;
  formatMajor: (major: string) => string;
}

/** แปลงข้อความอย่าง "1, 3, 5-8" เป็นชุดลำดับ (เริ่มที่ 1) */
const parseSelectionInput = (
  text: string,
  max: number
): { numbers: Set<number>; error: string | null } => {
  const numbers = new Set<number>();
  // ตัดตัวคั่นท้ายข้อความออก เพื่อไม่ให้ขึ้น error ระหว่างที่กำลังพิมพ์ เช่น "1-" หรือ "1,"
  const cleaned = text
    .replace(/[–—]/g, '-')
    .replace(/\s*-\s*/g, '-')
    .replace(/[\s,-]+$/, '');

  for (const token of cleaned.split(/[\s,]+/).filter(Boolean)) {
    const match = token.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) {
      return { numbers, error: `รูปแบบ "${token}" ไม่ถูกต้อง` };
    }
    const first = Number(match[1]);
    const last = match[2] ? Number(match[2]) : first;
    const from = Math.min(first, last);
    const to = Math.max(first, last);
    if (from < 1 || to > max) {
      return { numbers, error: `ลำดับต้องอยู่ระหว่าง 1-${max}` };
    }
    for (let n = from; n <= to; n++) numbers.add(n);
  }

  return { numbers, error: null };
};

/** แปลงลำดับกลับเป็นข้อความย่อ เช่น [1,2,3,5] → "1-3, 5" */
const formatSelectionInput = (numbers: number[]): string => {
  const parts: string[] = [];
  let i = 0;
  while (i < numbers.length) {
    let end = i;
    while (end + 1 < numbers.length && numbers[end + 1] === numbers[end] + 1) end++;
    parts.push(end > i ? `${numbers[i]}-${numbers[end]}` : `${numbers[i]}`);
    i = end + 1;
  }
  return parts.join(', ');
};

export const StudentSelectionView: React.FC<StudentSelectionViewProps> = ({
  apps,
  selectedIds,
  onSelectionChange,
  onViewApp,
  onPrintList,
  onPrintApplications,
  renderStatusBadge,
  formatMajor
}) => {
  const anchorIdRef = useRef<string | null>(null);
  const [draft, setDraft] = useState('');
  const [isEditingDraft, setIsEditingDraft] = useState(false);

  const selectedNumbers = useMemo(
    () =>
      apps.reduce<number[]>((acc, app, index) => {
        if (selectedIds.has(app.trackingId)) acc.push(index + 1);
        return acc;
      }, []),
    [apps, selectedIds]
  );

  const selectedCount = selectedNumbers.length;
  const hiddenSelectedCount = selectedIds.size - selectedCount;
  const canonicalInput = formatSelectionInput(selectedNumbers);
  const inputError = isEditingDraft ? parseSelectionInput(draft, apps.length).error : null;

  /** แทนที่การเลือกในรายการที่มองเห็น โดยไม่แตะคนที่ถูกตัวกรองซ่อนอยู่ */
  const replaceVisibleSelection = (visibleApps: Application[]) => {
    const next = new Set(selectedIds);
    apps.forEach(app => next.delete(app.trackingId));
    visibleApps.forEach(app => next.add(app.trackingId));
    onSelectionChange(next);
  };

  const handleCardClick = (event: React.MouseEvent, app: Application, index: number) => {
    const next = new Set(selectedIds);
    const anchorId = anchorIdRef.current;
    const anchorIndex = anchorId ? apps.findIndex(a => a.trackingId === anchorId) : -1;

    if (event.shiftKey && anchorId && anchorIndex >= 0) {
      const shouldSelect = selectedIds.has(anchorId);
      const from = Math.min(anchorIndex, index);
      const to = Math.max(anchorIndex, index);
      apps.slice(from, to + 1).forEach(a => {
        if (shouldSelect) next.add(a.trackingId);
        else next.delete(a.trackingId);
      });
    } else if (next.has(app.trackingId)) {
      next.delete(app.trackingId);
    } else {
      next.add(app.trackingId);
    }

    anchorIdRef.current = app.trackingId;
    onSelectionChange(next);
  };

  const handleInputChange = (value: string) => {
    setDraft(value);
    const { numbers, error } = parseSelectionInput(value, apps.length);
    if (!error) {
      replaceVisibleSelection(apps.filter((_, index) => numbers.has(index + 1)));
    }
  };

  const quickActions = [
    {
      label: 'ทั้งหมด',
      icon: <CheckCheck size={15} />,
      onClick: () => replaceVisibleSelection(apps)
    },
    {
      label: 'ยื่นแล้ว',
      icon: <Clock size={15} />,
      onClick: () => replaceVisibleSelection(apps.filter(a => a.status === 'submitted'))
    },
    {
      label: 'อนุมัติแล้ว',
      icon: <CheckCircle2 size={15} />,
      onClick: () => replaceVisibleSelection(apps.filter(a => a.status === 'approved'))
    },
    {
      label: 'สลับการเลือก',
      icon: <ArrowLeftRight size={15} />,
      onClick: () => replaceVisibleSelection(apps.filter(a => !selectedIds.has(a.trackingId)))
    },
    {
      label: 'ล้างที่เลือก',
      icon: <XCircle size={15} />,
      onClick: () => onSelectionChange(new Set())
    }
  ];

  return (
    <div className="student-select">
      <div className="student-select-panel">
        <div className="student-select-heading">
          <span className="student-select-step">1</span>
          <h3>เลือกนักศึกษา</h3>
          <span className="student-select-pill">
            <Users size={14} />
            {apps.length} คน
          </span>
        </div>

        <div className="student-select-tip">
          คลิกที่การ์ดเพื่อเลือก กด Shift ค้างไว้เพื่อเลือกเป็นช่วง
        </div>

        {apps.length === 0 ? (
          <div className="student-select-empty">ไม่พบข้อมูลใบสมัครที่ตรงกับเงื่อนไขการค้นหา</div>
        ) : (
          <div className="student-select-grid">
            {apps.map((app, index) => {
              const isSelected = selectedIds.has(app.trackingId);
              return (
                <div
                  key={app.trackingId}
                  className={`student-card${isSelected ? ' is-selected' : ''}`}
                >
                  <button
                    type="button"
                    className="student-card-main"
                    aria-pressed={isSelected}
                    onClick={(event) => handleCardClick(event, app, index)}
                  >
                    <span className="student-card-top">
                      <span className="student-card-number">{index + 1}</span>
                      <span className="student-card-check" aria-hidden="true">
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </span>
                    </span>
                    <span className="student-card-name">{app.fullName}</span>
                    <span className="student-card-meta">
                      {app.studentId} · {formatMajor(app.major)} · {app.year} · GPAX {app.gpax.toFixed(2)}
                    </span>
                    <span className="student-card-scholarship">{app.scholarshipName}</span>
                    <span className="student-card-status">{renderStatusBadge(app.status)}</span>
                  </button>
                  <button
                    type="button"
                    className="student-card-view"
                    onClick={() => onViewApp(app)}
                    title={`ดูข้อมูลใบสมัครของ ${app.fullName}`}
                    aria-label={`ดูข้อมูลใบสมัครของ ${app.fullName}`}
                  >
                    <Eye size={15} strokeWidth={1.8} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <aside className="student-select-panel student-select-side">
        <div className="student-select-heading">
          <span className="student-select-step">2</span>
          <h3>พิมพ์เอกสาร</h3>
        </div>
        <p className="student-select-description">
          เลือกนักศึกษาที่ต้องการ แล้วสั่งพิมพ์รายชื่อหรือใบสมัครได้ในครั้งเดียว
        </p>

        <label className="student-select-label" htmlFor="student-select-input">
          ลำดับที่ต้องการเลือก
        </label>
        <input
          id="student-select-input"
          className={`student-select-input${inputError ? ' has-error' : ''}`}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="เช่น 1, 3, 5-8"
          value={isEditingDraft ? draft : canonicalInput}
          aria-invalid={Boolean(inputError)}
          aria-describedby="student-select-hint"
          onFocus={() => {
            setDraft(canonicalInput);
            setIsEditingDraft(true);
          }}
          onBlur={() => setIsEditingDraft(false)}
          onChange={(event) => handleInputChange(event.target.value)}
        />
        <p
          id="student-select-hint"
          className={`student-select-hint${inputError ? ' is-error' : ''}`}
        >
          {inputError || 'คลิกการ์ดด้านซ้าย หรือพิมพ์เลขลำดับ ใช้ , คั่น และ - สำหรับช่วง'}
        </p>

        <div className="student-select-quick">
          {quickActions.map(action => (
            <button key={action.label} type="button" onClick={action.onClick}>
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>

        <dl className="student-select-summary">
          <div>
            <dt>ทั้งหมด</dt>
            <dd>{apps.length} คน</dd>
          </div>
          <div>
            <dt>ยังไม่เลือก</dt>
            <dd>{apps.length - selectedCount} คน</dd>
          </div>
          <div className="is-total">
            <dt>เลือกแล้ว</dt>
            <dd>{selectedCount} คน</dd>
          </div>
        </dl>

        {hiddenSelectedCount > 0 && (
          <p className="student-select-hidden-note">
            มีอีก {hiddenSelectedCount} คนที่เลือกไว้แต่ถูกตัวกรองซ่อนอยู่ จะไม่ถูกพิมพ์
          </p>
        )}

        <div className="student-select-actions">
          <button
            type="button"
            className="student-select-print is-primary"
            disabled={selectedCount === 0}
            onClick={onPrintList}
          >
            <Printer size={17} />
            พิมพ์รายชื่อ ({selectedCount})
          </button>
          <button
            type="button"
            className="student-select-print"
            disabled={selectedCount === 0}
            onClick={onPrintApplications}
          >
            <FileText size={17} />
            พิมพ์ใบสมัคร ({selectedCount})
          </button>
        </div>
      </aside>
    </div>
  );
};
