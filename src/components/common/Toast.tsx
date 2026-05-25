import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'info' | 'success' | 'error' | 'warning';

interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  show: (text: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((text: string, type: ToastType = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const getIcon = (type: ToastType): string => {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '✕';
      case 'warning': return '⚠';
      default: return 'ℹ';
    }
  };

  const getBackgroundColor = (type: ToastType): string => {
    switch (type) {
      case 'success': return '#52c41a';
      case 'error': return '#ff4d4f';
      case 'warning': return '#faad14';
      default: return '#1890ff';
    }
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={containerStyle}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              ...toastStyle,
              backgroundColor: getBackgroundColor(toast.type),
            }}
          >
            <span style={{ marginRight: 8 }}>{getIcon(toast.type)}</span>
            {toast.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 70,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 1100,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  pointerEvents: 'none',
};

const toastStyle: React.CSSProperties = {
  color: 'white',
  padding: '8px 16px',
  borderRadius: 4,
  fontSize: 14,
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  display: 'flex',
  alignItems: 'center',
  minWidth: 120,
  justifyContent: 'center',
  pointerEvents: 'auto',
};