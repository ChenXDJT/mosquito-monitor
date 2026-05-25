import React from 'react';

interface LoadingProps {
  fullScreen?: boolean;
  tip?: string;
}

export const Loading: React.FC<LoadingProps> = ({ fullScreen = false, tip = '加载中...' }) => {
  const containerStyle: React.CSSProperties = fullScreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.8)',
        zIndex: 1000,
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      };

  return (
    <div style={containerStyle}>
      <div className="loading-spinner" style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 32,
            height: 32,
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #1890ff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 8px',
          }}
        />
        <div style={{ fontSize: 14, color: '#666' }}>{tip}</div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};