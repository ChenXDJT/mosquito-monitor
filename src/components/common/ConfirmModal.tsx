import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => void;
  close: () => void;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (!context) throw new Error('useConfirm must be used within ConfirmModalProvider');
  return context;
};

export const ConfirmModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [loading, setLoading] = useState(false);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    setOptions(null);
    setLoading(false);
  }, []);

  const handleConfirm = async () => {
    if (!options) return;
    setLoading(true);
    try {
      await options.onConfirm();
      close();
    } catch (error) {
      console.error('确认操作失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    options?.onCancel?.();
    close();
  };

  if (!visible || !options) return <>{children}</>;

  return (
    <ConfirmContext.Provider value={{ confirm, close }}>
      {children}
      <div className="modal-overlay" onClick={handleCancel} style={overlayStyle}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={contentStyle}>
          <div style={headerStyle}>
            <h4>{options.title || '提示'}</h4>
          </div>
          <div style={bodyStyle}>
            <p>{options.message}</p>
          </div>
          <div style={footerStyle}>
            <button onClick={handleCancel} style={cancelBtnStyle} disabled={loading}>
              {options.cancelText || '取消'}
            </button>
            <button onClick={handleConfirm} style={confirmBtnStyle} disabled={loading}>
              {loading ? '处理中...' : (options.confirmText || '确定')}
            </button>
          </div>
        </div>
      </div>
    </ConfirmContext.Provider>
  );
};

// 样式对象
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const contentStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: 8,
  width: '80%',
  maxWidth: 300,
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};

const headerStyle: React.CSSProperties = {
  padding: '16px 16px 8px',
  borderBottom: '1px solid #eee',
};

const bodyStyle: React.CSSProperties = {
  padding: '16px',
  fontSize: 14,
  color: '#333',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  borderTop: '1px solid #eee',
};

const cancelBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
};

const confirmBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: '12px',
  background: 'none',
  border: 'none',
  borderLeft: '1px solid #eee',
  cursor: 'pointer',
  fontSize: 14,
  color: '#1890ff',
  fontWeight: 500,
};