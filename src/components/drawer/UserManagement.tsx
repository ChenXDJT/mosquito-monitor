import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { User, CreateUserParams } from '../../types';
import { STREETS } from '../../config';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRegion, setNewRegion] = useState<string>(STREETS[0]);

  const loadUsers = async () => {
    try {
      const list = await adminService.listUsers();
      setUsers(list);
    } catch (err) {
      console.error(err);
      alert('加载子账号失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async () => {
    if (!newUsername || !newPassword) return alert('请填写用户名和密码');
    const params: CreateUserParams = {
      username: newUsername,
      password: newPassword,
      region: newRegion,
      role: 'user',
    };
    try {
      await adminService.createUser(params);
      await loadUsers();
      setShowCreate(false);
      setNewUsername('');
      setNewPassword('');
    } catch (err) {
      alert('创建失败');
    }
  };

  const handleResetPassword = async (userId: string, newPassword: string) => {
    if (!newPassword) return;
    try {
      await adminService.updateUser(userId, { password: newPassword });
      alert('密码重置成功');
    } catch (err) {
      alert('重置失败');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('确定删除该账号？数据将保留但账号无法登录')) return;
    try {
      await adminService.deleteUser(userId);
      await loadUsers();
    } catch (err) {
      alert('删除失败');
    }
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div className="user-management">
      <div className="admin-header">
        <h4>子账号管理</h4>
        <button onClick={() => setShowCreate(true)}>+ 创建子账号</button>
      </div>
      <table className="user-table">
        <thead>
          <tr><th>用户名</th><th>负责区域</th><th>创建时间</th><th>操作</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.region}</td>
              <td>{new Date(u.createdAt).toLocaleDateString()}</td>
              <td>
                <button onClick={() => {
                  const newPwd = prompt('请输入新密码');
                  if (newPwd) handleResetPassword(u.id, newPwd);
                }}>重置密码</button>
                <button onClick={() => handleDelete(u.id)}>删除</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h4>创建子账号</h4>
            <input placeholder="用户名" value={newUsername} onChange={e => setNewUsername(e.target.value)} />
            <input type="password" placeholder="密码" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            <select value={newRegion} onChange={e => setNewRegion(e.target.value)}>
              {STREETS.map(s => <option key={s}>{s}</option>)}
            </select>
            <div className="modal-buttons">
              <button onClick={handleCreate}>创建</button>
              <button onClick={() => setShowCreate(false)}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};