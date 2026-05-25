/**
 * Service Worker 注册工具
 * 用于注册自定义 Service Worker 并处理更新
 */

/**
 * 注册 Service Worker
 * @returns Promise<ServiceWorkerRegistration | undefined>
 */
export async function registerSW() {
  if (!('serviceWorker' in navigator)) {
    console.log('当前浏览器不支持 Service Worker');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    console.log('Service Worker 注册成功，作用域:', registration.scope);

    // 检查是否有更新
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 新版本已就绪，提示用户刷新
            console.log('新版本已准备就绪，请刷新页面');
            // 可触发全局事件或显示提示条
            window.dispatchEvent(new CustomEvent('sw-update-ready'));
          }
        });
      }
    });

    return registration;
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
 * @param message 消息对象
 */
export async function sendSWMessage(message: any) {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.active) {
    registration.active.postMessage(message);
  }
}