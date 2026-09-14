import React from 'react';
import { useScholarship } from '../../context/ScholarshipContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useScholarship();

  return (
    <div className="toast-container">
      {toasts.map(toast => {
        let icon = '🔔';
        if (toast.type === 'success') icon = '✅';
        if (toast.type === 'warning') icon = '⚠️';
        if (toast.type === 'error') icon = '❌';

        return (
          <div 
            key={toast.id} 
            className="toast"
            onClick={() => removeToast(toast.id)}
            role="alert"
          >
            <span>{icon}</span>
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
