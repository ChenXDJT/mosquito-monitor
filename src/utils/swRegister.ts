/**
 * Service Worker 注册工具
 * 适配 GitHub Pages 子路径（仓库名 mosquito-monitor）
 */

export async function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.log('当前浏览器不支持 Service Worker');
    return;
  }

  // 根据你的 GitHub Pages 子路径配置
  const swUrl = '/mosquito-monitor/sw.js';
  const scope = '/mosquito-monitor/';

  try {
    const registration = await navigator.serviceWorker.register(swUrl, { scope });
    console.log('Service Worker 注册成功，作用域:', registration.scope);
    // 监听更新
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 新版本已就绪，可提示用户刷新
            console.log('新版本已准备就绪，请刷新页面');
            window.dispatchEvent(new CustomEvent('sw-update-ready'));
          }
        });
      }
    });
  } catch (error) {
    console.error('Service Worker 注册失败:', error);
  }
}

/**
 * 检查当前页面是否被 Service Worker 控制
 */
export function isControlledBySW(): boolean {
  return !!navigator.serviceWorker.controller;
}

/**
 * 向 Service Worker 发送消息
 */
export async function sendSWMessage(message: any) {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.active) {
    registration.active.postMessage(message);
  }
}