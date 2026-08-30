import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { removeToast } from '../store/slices/toastSlice';
import { useToast as useReduxToast } from '../store/hooks';
import './Toast.css';

export function ToastProvider({ children }) {
  const dispatch = useDispatch();
  const toasts = useSelector((state) => state.toast.toasts || []);

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="toast-icon success" size={18} />;
      case 'error':
        return <AlertCircle className="toast-icon error" size={18} />;
      case 'warning':
        return <AlertTriangle className="toast-icon warning" size={18} />;
      default:
        return <Info className="toast-icon info" size={18} />;
    }
  };

  return (
    <>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-card toast-${t.type} animate-pop-in`}>
            <div className="toast-content">
              {getIcon(t.type)}
              <span className="toast-message">{t.message}</span>
            </div>
            <button
              onClick={() => dispatch(removeToast(t.id))}
              className="toast-close"
              aria-label="Close notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

export function useToast() {
  return useReduxToast();
}

