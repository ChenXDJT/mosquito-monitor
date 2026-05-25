import React from 'react';

interface BottomBarProps {
  onAdd: (type: string) => void;
}

// 类型映射到显示文本和图标（可用 emoji 或文字）
const BUTTONS = [
  { type: 'case', label: '病例', icon: '🦟', color: '#ff4d4f' },
  { type: 'water', label: '积水点', icon: '💧', color: '#13c2c2' },
  { type: 'blackspot', label: '黑点', icon: '⚠️', color: '#1677ff' },
  { type: 'adult', label: '成蚊', icon: '🦗', color: '#722ed1' },
  { type: 'trap', label: '诱卵器', icon: '🧪', color: '#faad14' },
];

export const BottomBar: React.FC<BottomBarProps> = ({ onAdd }) => {
  return (
    <div className="bottom-bar">
      {BUTTONS.map((btn) => (
        <button
          key={btn.type}
          onClick={() => onAdd(btn.type)}
          className="action-btn"
        >
          <span className="icon" style={{ color: btn.color }}>
            {btn.icon}
          </span>
          <span className="label">{btn.label}</span>
        </button>
      ))}
    </div>
  );
};