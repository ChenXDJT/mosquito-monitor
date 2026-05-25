import React, { useRef, useState } from 'react';
import { getPhotoPublicUrl } from '../../config/supabase';

interface PhotoUploaderProps {
  onFilesSelected: (files: File[]) => void;
  existingPhotos?: string[]; // 已有照片的 Storage 路径
  onRemoveExisting?: (index: number) => void;
  multiple?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  onFilesSelected,
  existingPhotos = [],
  onRemoveExisting,
  multiple = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!multiple && files.length > 1) {
      alert('最多只能选择一张照片');
      return;
    }
    // 限制单张 5MB，总大小 20MB
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > 20 * 1024 * 1024) {
      alert('照片总大小不能超过 20MB');
      return;
    }
    setSelectedFiles(files);
    // 生成预览 URL
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews(newPreviews);
    onFilesSelected(files);
  };

  const removeSelected = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
    onFilesSelected(newFiles);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/jpg"
        multiple={multiple}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={triggerFileInput}
        style={{
          padding: '6px 12px',
          background: '#f0f0f0',
          border: '1px dashed #ccc',
          borderRadius: 4,
          cursor: 'pointer',
          marginBottom: 8,
        }}
      >
        + 选择照片
      </button>

      {/* 已有照片（编辑时） */}
      {existingPhotos.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>已有照片：</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {existingPhotos.map((path, idx) => (
              <div key={idx} style={{ position: 'relative', width: 80, height: 80, border: '1px solid #eee', borderRadius: 4, overflow: 'hidden' }}>
                <img src={getPhotoPublicUrl(path)} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {onRemoveExisting && (
                  <button
                    type="button"
                    onClick={() => onRemoveExisting(idx)}
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      background: 'rgba(0,0,0,0.5)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      cursor: 'pointer',
                      fontSize: 12,
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 新选择的照片预览 */}
      {previews.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>新照片：</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {previews.map((src, idx) => (
              <div key={idx} style={{ position: 'relative', width: 80, height: 80, border: '1px solid #eee', borderRadius: 4, overflow: 'hidden' }}>
                <img src={src} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => removeSelected(idx)}
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    background: 'rgba(0,0,0,0.5)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    cursor: 'pointer',
                    fontSize: 12,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};