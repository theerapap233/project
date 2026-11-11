import React, { useEffect } from 'react';
import { useScholarship } from '../../context/ScholarshipContext';
import { useMyApplications } from '../../hooks/useMyApplications';
import { Application } from '../../types/application';
import { formatThaiDate } from '../../utils/dateFormatter';
import { STATUS_META } from '../../utils/applicationStatus';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const GREEN = 'var(--math-green, #077b38)';
const AMBER = '#d97706';
const RED = '#dc2626';
const GREY = '#cbd5e1';

/** interviewDate อาจเป็นวันที่จริง (YYYY-MM-DD / YYYY-MM-DDTHH:mm) หรือข้อความ placeholder */
const parseInterviewDate = (value: string | undefined): string | null => {
  if (!value) return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s](\d{2}:\d{2}))?/);
  if (!match) return null;
  const datePart = formatThaiDate(match[1]);
  return match[2] ? `${datePart} เวลา ${match[2]} น.` : datePart;
};

type StepState = 'done' | 'current' | 'upcoming' | 'failed';

interface Step {
  title: string;
  detail: string;
  state: StepState;
}

const buildSteps = (app: Application): Step[] => {
  const interview = parseInterviewDate(app.interviewDate);
  const isDecided = app.status !== 'submitted';

  return [
    {
      title: 'ยื่นใบสมัคร',
      detail: formatThaiDate(app.submissionDate),
      state: 'done'
    },
    {
      title: 'ตรวจสอบคุณสมบัติ',
      detail: isDecided || interview ? 'เรียบร้อย' : 'กำลังดำเนินการ',
      state: isDecided || interview ? 'done' : 'current'
    },
    {
      title: 'สัมภาษณ์',
      detail: interview || (isDecided ? 'เรียบร้อย' : 'รอประกาศ'),
      state: isDecided ? 'done' : interview ? 'current' : 'upcoming'
    },
    {
      title: 'ประกาศผล',
      detail:
        app.status === 'approved' ? 'อนุมัติทุน' :
        app.status === 'rejected' ? 'ไม่ผ่าน' : 'รอผล',
      state:
        app.status === 'approved' ? 'done' :
        app.status === 'rejected' ? 'failed' : 'upcoming'
    }
  ];
};

const stepColor = (state: StepState) =>
  state === 'done' ? GREEN : state === 'current' ? AMBER : state === 'failed' ? RED : GREY;

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

const StatusTimeline: React.FC<{ steps: Step[] }> = ({ steps }) => (
  <ol
    aria-label="ขั้นตอนการพิจารณาใบสมัคร"
    style={{ display: 'flex', listStyle: 'none', margin: '18px 0 6px', padding: 0 }}
  >
    {steps.map((step, index) => {
      const color = stepColor(step.state);
      const reached = step.state !== 'upcoming';
      return (
        <li
          key={step.title}
          aria-current={step.state === 'current' ? 'step' : undefined}
          style={{ flex: 1, position: 'relative', textAlign: 'center', minWidth: 0 }}
        >
          {index > 0 && (
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 13,
                right: '50%',
                width: '100%',
                height: 3,
                borderRadius: 2,
                background: reached ? color : GREY,
                zIndex: 0
              }}
            />
          )}
          <span
            style={{
              position: 'relative',
              zIndex: 1,
              width: 28,
              height: 28,
              margin: '0 auto',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 700,
              color: reached ? '#fff' : '#64748b',
              background: reached ? color : '#fff',
              border: `2px solid ${color}`,
              boxShadow: step.state === 'current' ? '0 0 0 4px rgba(217, 119, 6, 0.18)' : 'none'
            }}
          >
            {step.state === 'done' ? '✓' : step.state === 'failed' ? '✕' : index + 1}
          </span>
          <div
            style={{
              marginTop: 8,
              fontSize: '0.8rem',
              fontWeight: step.state === 'current' ? 700 : 600,
              color: step.state === 'upcoming' ? 'var(--text-muted, #64748b)' : 'var(--text-main, #0f172a)',
              lineHeight: 1.3,
              padding: '0 2px'
            }}
          >
            {step.title}
          </div>
          <div
            style={{
              fontSize: '0.72rem',
              color: step.state === 'current' ? AMBER : step.state === 'failed' ? RED : 'var(--text-muted, #64748b)',
              marginTop: 2,
              lineHeight: 1.3,
              padding: '0 2px'
            }}
          >
            {step.detail}
          </div>
        </li>
      );
    })}
  </ol>
);

/* ------------------------------------------------------------------ */
/* Card                                                                */
/* ------------------------------------------------------------------ */

const NextStepNote: React.FC<{ app: Application; onGoDownloads: () => void }> = ({ app, onGoDownloads }) => {
  const interview = parseInterviewDate(app.interviewDate);

  let icon = '🔎';
  let text: React.ReactNode = 'เจ้าหน้าที่กำลังตรวจสอบคุณสมบัติและเอกสารของคุณ เมื่อมีวันนัดสัมภาษณ์จะแสดงที่หน้านี้';
  let tone = { bg: '#f8fafc', border: '#e2e8f0' };
  let action: React.ReactNode = null;

  if (app.status === 'submitted' && interview) {
    icon = '📅';
    text = (
      <>
        นัดสัมภาษณ์ <strong>{interview}</strong> กรุณาเตรียมเอกสารตัวจริงและมาก่อนเวลา 15 นาที
      </>
    );
    tone = { bg: '#fffbeb', border: '#fde68a' };
  } else if (app.status === 'approved') {
    icon = '🎉';
    text = 'ยินดีด้วย! คุณได้รับอนุมัติทุนนี้แล้ว ขั้นตอนถัดไปคือดาวน์โหลดและส่งสัญญารับทุนให้ภาควิชา';
    tone = { bg: '#ecfdf5', border: '#a7f3d0' };
    action = (
      <button type="button" className="btn btn-primary btn-sm" onClick={onGoDownloads} style={{ marginTop: 10 }}>
        ไปที่เอกสารดาวน์โหลด
      </button>
    );
  } else if (app.status === 'rejected') {
    icon = '💬';
    text = 'ใบสมัครนี้ไม่ผ่านการพิจารณาในรอบนี้ คุณยังสามารถสมัครทุนอื่นที่เปิดรับอยู่ได้ หากมีข้อสงสัยติดต่อเจ้าหน้าที่ภาควิชา';
    tone = { bg: '#fef2f2', border: '#fecaca' };
  }

  return (
    <div
      style={{
        marginTop: 14,
        padding: '12px 14px',
        borderRadius: 12,
        background: tone.bg,
        border: `1px solid ${tone.border}`,
        fontSize: '0.86rem',
        lineHeight: 1.6,
        color: 'var(--text-main, #0f172a)'
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span aria-hidden="true" style={{ fontSize: '1.05rem', lineHeight: 1.4 }}>{icon}</span>
        <div>
          <div>{text}</div>
          {action}
        </div>
      </div>
    </div>
  );
};

const ApplicationStatusCard: React.FC<{ app: Application; onGoDownloads: () => void }> = ({ app, onGoDownloads }) => {
  const meta = STATUS_META[app.status] ?? STATUS_META.submitted;

  return (
    <article
      style={{
        border: '1px solid var(--border-light, #e2e8f0)',
        borderRadius: 16,
        padding: '16px 18px',
        background: 'var(--surface-card, #fff)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0, flex: '1 1 260px' }}>
          <h4 style={{ margin: 0, fontSize: '1rem', lineHeight: 1.45, color: 'var(--text-main, #0f172a)' }}>
            {app.scholarshipName}
          </h4>
          <div style={{ marginTop: 4, fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
            รหัสติดตาม{' '}
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: 'var(--text-main, #0f172a)' }}>
              {app.trackingId}
            </span>
          </div>
        </div>
        <span
          style={{
            flexShrink: 0,
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: 999,
            color: meta.color,
            background: meta.bg,
            border: `1px solid ${meta.border}`
          }}
        >
          {meta.label}
        </span>
      </div>

      <StatusTimeline steps={buildSteps(app)} />
      <NextStepNote app={app} onGoDownloads={onGoDownloads} />
    </article>
  );
};

/* ------------------------------------------------------------------ */
/* Modal                                                               */
/* ------------------------------------------------------------------ */

export const MyApplicationsModal: React.FC = () => {
  const { isMyApplicationsOpen, closeMyApplications, currentUser, scrollToSection } = useScholarship();
  const { isStudent, myApplications, counts } = useMyApplications();

  useEffect(() => {
    if (!isMyApplicationsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMyApplications();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMyApplicationsOpen, closeMyApplications]);

  if (!isMyApplicationsOpen || !isStudent || !currentUser) return null;

  const goTo = (sectionId: string) => {
    closeMyApplications();
    scrollToSection(sectionId);
  };

  const summary = [
    { label: 'ทั้งหมด', value: counts.total, color: 'var(--text-main, #0f172a)' },
    { label: 'รอพิจารณา', value: counts.submitted, color: STATUS_META.submitted.color },
    { label: 'อนุมัติแล้ว', value: counts.approved, color: STATUS_META.approved.color },
    { label: 'ไม่ผ่าน', value: counts.rejected, color: STATUS_META.rejected.color }
  ];

  return (
    <div
      className="modal-backdrop open"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeMyApplications();
      }}
    >
      <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="my-apps-title" style={{ maxWidth: 760 }}>
        <div className="modal-header">
          <div>
            <h3 id="my-apps-title" style={{ margin: 0 }}>ใบสมัครของฉัน</h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', marginTop: 2 }}>
              {currentUser.name} · รหัส {currentUser.studentId}
            </div>
          </div>
          <button type="button" className="modal-close-btn" onClick={closeMyApplications} aria-label="ปิดหน้าต่าง">
            &times;
          </button>
        </div>

        <div className="modal-body">
          {myApplications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 12px' }}>
              <div aria-hidden="true" style={{ fontSize: '2.4rem' }}>📭</div>
              <h4 style={{ margin: '10px 0 6px', color: 'var(--text-main, #0f172a)' }}>ยังไม่มีใบสมัคร</h4>
              <p style={{ margin: '0 0 18px', color: 'var(--text-muted, #64748b)', fontSize: '0.9rem' }}>
                เมื่อคุณยื่นสมัครทุนแล้ว สถานะการพิจารณาจะแสดงที่นี่
              </p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => goTo('scholarships')}>
                ดูทุนที่เปิดรับสมัคร
              </button>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: 8,
                  marginBottom: 18
                }}
              >
                {summary.map(item => (
                  <div
                    key={item.label}
                    style={{
                      padding: '10px 10px',
                      borderRadius: 12,
                      minWidth: 0,
                      background: 'var(--surface-ground, #f8fafc)',
                      border: '1px solid var(--border-light, #e2e8f0)'
                    }}
                  >
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted, #64748b)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 700, color: item.color, lineHeight: 1.3 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {myApplications.map(app => (
                  <ApplicationStatusCard key={app.trackingId} app={app} onGoDownloads={() => goTo('downloads')} />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary btn-sm" onClick={closeMyApplications}>
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
