import React, { useState } from 'react';
import { useTask } from '../../hooks/useTask';
import { useAuth } from '../../hooks/useAuth';
import { STREETS } from '../../config';

export const TaskPanel: React.FC = () => {
  const { user } = useAuth();
  const { currentTask, tasks, createTask, endTask, pauseTracking, resumeTracking, isTracking } = useTask();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().slice(0, 10));
  const [newTaskRegion, setNewTaskRegion] = useState(user?.region || '');
  const [hideHistory, setHideHistory] = useState(false);

  const handleCreate = async () => {
    if (!newTaskName) return alert('请填写任务名称');
    await createTask({
      name: newTaskName,
      date: newTaskDate,
      region: newTaskRegion,
      hideHistory,
    });
    setShowCreateForm(false);
    setNewTaskName('');
  };

  const handleEnd = async () => {
    if (currentTask) {
      const report = prompt('请输入任务完成报告（问题总结等）', '');
      await endTask(currentTask.id, { problems: report || '' });
    }
  };

  return (
    <div className="task-panel">
      <div className="task-header">
        <h4>任务管理</h4>
        <button className="create-task-btn" onClick={() => setShowCreateForm(true)}>+ 新建任务</button>
      </div>

      {currentTask && (
        <div className="current-task">
          <div className="task-title">进行中：{currentTask.name}</div>
          <div>开始时间：{new Date(currentTask.startedAt).toLocaleString()}</div>
          <div className="task-actions">
            <button onClick={() => isTracking ? pauseTracking() : resumeTracking()}>
              {isTracking ? '暂停轨迹' : '开启轨迹'}
            </button>
            <button onClick={handleEnd} className="end-task">结束任务</button>
          </div>
        </div>
      )}

      <div className="task-history">
        <h5>历史任务</h5>
        {tasks.filter(t => t.status === 'completed').map(task => (
          <div key={task.id} className="task-item">
            <span>{task.name}</span>
            <span>{new Date(task.date).toLocaleDateString()}</span>
            <button onClick={() => {/* 查看详情 */}}>详情</button>
          </div>
        ))}
      </div>

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h4>新建任务</h4>
            <input placeholder="任务名称" value={newTaskName} onChange={e => setNewTaskName(e.target.value)} />
            <input type="date" value={newTaskDate} onChange={e => setNewTaskDate(e.target.value)} />
            <select value={newTaskRegion} onChange={e => setNewTaskRegion(e.target.value)}>
              {STREETS.map(s => <option key={s}>{s}</option>)}
            </select>
            <label>
              <input type="checkbox" checked={hideHistory} onChange={e => setHideHistory(e.target.checked)} />
              隐藏历史数据（仅显示本任务记录）
            </label>
            <div className="modal-buttons">
              <button onClick={handleCreate}>创建</button>
              <button onClick={() => setShowCreateForm(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};