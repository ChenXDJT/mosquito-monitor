import React, { useState } from 'react';
import { useRecords } from '../../hooks/useRecords';
import { getPhotoPublicUrl } from '../../config/supabase';

export const RecordList: React.FC = () => {
  const { records, isLoading, deleteRecord } = useRecords();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <div>加载记录中...</div>;

  return (
    <div className="record-list">
      <h4>我的记录</h4>
      {records.length === 0 && <div>暂无记录</div>}
      {records.map(record => (
        <div key={record.id} className="record-card" onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}>
          <div className="record-header">
            <span className="record-type">{record.type}</span>
            <span className="record-time">{new Date(record.createdAt).toLocaleString()}</span>
          </div>
          <div className="record-address">{record.address || `${record.street} ${record.community}`}</div>
          {expandedId === record.id && (
            <div className="record-detail">
              <div><strong>坐标：</strong>{record.location.lng.toFixed(6)}, {record.location.lat.toFixed(6)}</div>
              <div><strong>街道/居委：</strong>{record.street} / {record.community}</div>
              <div><strong>表单数据：</strong><pre>{JSON.stringify(record.formData, null, 2)}</pre></div>
              {record.photos.length > 0 && (
                <div className="record-photos">
                  {record.photos.map((path, idx) => (
                    <img key={idx} src={getPhotoPublicUrl(path)} alt="photo" style={{ width: 60, height: 60, margin: 4 }} />
                  ))}
                </div>
              )}
              <div className="record-actions">
                <button onClick={() => {/* 编辑功能，需要打开表单 */}}>编辑</button>
                <button onClick={async () => { if (confirm('确定删除？')) await deleteRecord(record.id); }}>删除</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};