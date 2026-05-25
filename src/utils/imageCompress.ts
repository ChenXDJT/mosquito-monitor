/**
 * 图片压缩工具
 * 将用户选择的图片压缩为指定尺寸和质量的 JPEG/PNG
 */

import { IMAGE_CONFIG } from '../config';

/**
 * 压缩图片文件（支持 File 或 Blob）
 * @param file 原始图片文件
 * @returns Promise<Blob> 压缩后的图片 Blob
 */
export async function compressImage(file: File | Blob): Promise<Blob> {
  // 创建 Image 元素
  const img = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法获取 Canvas 上下文');

  // 计算缩放比例
  let width = img.width;
  let height = img.height;
  if (width > IMAGE_CONFIG.MAX_WIDTH) {
    const ratio = IMAGE_CONFIG.MAX_WIDTH / width;
    width = IMAGE_CONFIG.MAX_WIDTH;
    height = height * ratio;
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(img, 0, 0, width, height);

  // 转换为 Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('图片压缩失败'));
      },
      IMAGE_CONFIG.FORMAT,
      IMAGE_CONFIG.QUALITY
    );
  });
}

/**
 * 将多个图片文件批量压缩
 * @param files 文件数组
 * @returns Promise<Blob[]> 压缩后的 Blob 数组
 */
export async function compressImages(files: File[]): Promise<Blob[]> {
  const promises = files.map(file => compressImage(file));
  return Promise.all(promises);
}