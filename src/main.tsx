import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';
import { registerSW } from './utils/swRegister';

// 注册 Service Worker（PWA 离线缓存）
registerSW();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);