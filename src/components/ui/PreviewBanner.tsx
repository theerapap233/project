import React from 'react';
import { Eye, LayoutDashboard } from 'lucide-react';
import { useScholarship } from '../../context/ScholarshipContext';

export const PreviewBanner: React.FC = () => {
  const { currentUser, isAdminActive, isPreviewMode, setIsPreviewMode } = useScholarship();
  const isStaffMode = Boolean(currentUser && isAdminActive);

  if (!isStaffMode) return null;

  return (
    <div className="preview-mode-dock" role="group" aria-label="สลับโหมดการทำงาน">
      <button
        type="button"
        className={`preview-mode-option${isPreviewMode ? ' is-active' : ''}`}
        aria-current={isPreviewMode ? 'page' : undefined}
        disabled={isPreviewMode}
        onClick={() => {
          setIsPreviewMode(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        title="ดูเว็บไซต์ในมุมมองผู้สมัคร"
      >
        <Eye size={16} />
        <span>เว็บไซต์</span>
      </button>
      <button
        type="button"
        className={`preview-mode-action${!isPreviewMode ? ' is-active' : ''}`}
        aria-current={!isPreviewMode ? 'page' : undefined}
        disabled={!isPreviewMode}
        onClick={() => {
          setIsPreviewMode(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        title="กลับไปยัง Staff Portal"
      >
        <LayoutDashboard size={16} />
        <span>Staff Portal</span>
      </button>
    </div>
  );
};
