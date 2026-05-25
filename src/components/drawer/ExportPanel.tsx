import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTask } from '../../hooks/useTask';
import { exportService } from '../../services/exportService';

export const ExportPanel: React.FC = () => {
  const { user: _user } = useAuth();
  const { tasks } = useTask();
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [exporting, setExporting] = useState(false);

  const handleExportJSON = async () => {
    setExporting(true);
    try {
      await exportService.exportToJSON();
    } catch (err) {
      alert('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!selectedTaskId) return alert('请选择一个任务');
    const task = tasks.find(t => t.id === selectedTaskId);
    if (!task) return;
    setExporting(true);
    try {
      await exportService.exportTaskToExcel(selectedTaskId, task.name);
    } catch (err) {
      alert('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPhotos = async () => {
    if (!selectedTaskId) return alert('请选择一个任务');
    const task = tasks.find(t => t.id === selectedTaskId);
    if (!task) return;
    setExporting(true);
    try {
      await exportService.exportTaskPhotosToZip(selectedTaskId, task.name, (cur, total) => {
        console.log(`导出照片进度: ${cur}/${total}`);
      });
    } catch (err) {
      alert('导出失败');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-panel">
      <h4>数据导出</h4>
      <div className="export-group">
        <button onClick={handleExportJSON} disabled={exporting}>导出全部记录 (JSON)</button>
      </div>
      <div className="export-group">
        <label>选择任务：</label>
        <select value={selectedTaskId} onChange={e => setSelectedTaskId(e.target.value)}>
          <option value="">请选择</option>
          {tasks.filter(t => t.status === 'completed').map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <button onClick={handleExportExcel} disabled={exporting}>导出 Excel</button>
        <button onClick={handleExportPhotos} disabled={exporting}>导出照片 ZIP</button>
      </div>
      <div className="note">* 子账号仅导出自己的记录，管理员导出全部</div>
    </div>
  );
};