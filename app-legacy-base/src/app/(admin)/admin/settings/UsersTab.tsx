'use client';

import { useState, useEffect, useCallback } from 'react';

interface User {
    id: string;
    username: string;
    name: string;
    role: string;
    email: string | null;
    mobile: string | null;
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
}

interface AuthUser {
    id: string;
}

export default function UsersTab() {
    const [users, setUsers] = useState<User[]>([]);
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [changePasswordId, setChangePasswordId] = useState<string | null>(null);

    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('admin');
    const [newEmail, setNewEmail] = useState('');
    const [newMobile, setNewMobile] = useState('');

    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editMobile, setEditMobile] = useState('');

    const [newPwd, setNewPwd] = useState('');
    const [confirmPwd, setConfirmPwd] = useState('');

    const fetchUsers = useCallback(async () => {
        try {
            const [usersRes, authRes] = await Promise.all([
                fetch('/api/users'),
                fetch('/api/auth/me'),
            ]);

            const usersData = await usersRes.json();
            setUsers(usersData.users || []);

            if (authRes.ok) {
                const authData = await authRes.json();
                setAuthUser(authData.user || null);
            }
        } catch (e) {
            console.error('Failed to fetch users', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    const handleCreate = async () => {
        if (!newUsername || !newPassword || !newName) { alert('帳號、密碼、姓名為必填'); return; }
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername, password: newPassword, name: newName, role: newRole, email: newEmail, mobile: newMobile }),
            });
            if (res.ok) {
                alert('✅ 帳號建立成功');
                setShowCreate(false);
                setNewUsername(''); setNewPassword(''); setNewName(''); setNewEmail(''); setNewMobile('');
                fetchUsers();
            } else {
                const err = await res.json();
                alert(`❌ ${err.error}`);
            }
        } catch { alert('❌ 建立失敗'); }
    };

    const handleEdit = async (id: string) => {
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName, email: editEmail, mobile: editMobile }),
            });
            if (res.ok) { alert('✅ 已更新'); setEditingId(null); fetchUsers(); }
            else { const err = await res.json(); alert(`❌ ${err.error}`); }
        } catch { alert('❌ 更新失敗'); }
    };

    const handleChangePassword = async (id: string) => {
        if (!newPwd) { alert('請輸入新密碼'); return; }
        if (newPwd.length < 6) { alert('密碼至少 6 個字元'); return; }
        if (newPwd !== confirmPwd) { alert('兩次密碼輸入不一致'); return; }
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPwd }),
            });
            if (res.ok) { alert('✅ 密碼已變更'); setChangePasswordId(null); setNewPwd(''); setConfirmPwd(''); }
            else { const err = await res.json(); alert(`❌ ${err.error}`); }
        } catch { alert('❌ 變更失敗'); }
    };

    const handleToggleActive = async (user: User) => {
        if (!confirm(`確定要${user.isActive ? '停用' : '啟用'} ${user.name} 嗎？`)) return;
        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !user.isActive }),
            });
            if (res.ok) fetchUsers();
            else { const err = await res.json(); alert(`❌ ${err.error}`); }
        } catch { alert('❌ 操作失敗'); }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`確定要刪除 ${user.name} 嗎？\n\n刪除後會直接從資料庫移除，且無法復原。`)) return;
        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                alert('✅ 帳號已刪除');
                if (editingId === user.id) setEditingId(null);
                if (changePasswordId === user.id) setChangePasswordId(null);
                fetchUsers();
            } else {
                const err = await res.json();
                alert(`❌ ${err.error}`);
            }
        } catch {
            alert('❌ 刪除失敗');
        }
    };

    if (loading) {
        return <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-efan-primary" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">管理後台登入帳戶、變更密碼</p>
                <button onClick={() => setShowCreate(!showCreate)}
                    className="px-4 py-2 bg-efan-primary text-white rounded-xl font-bold text-sm hover:bg-efan-accent transition-all shadow-lg shadow-efan-primary/25">
                    + 新增帳號
                </button>
            </div>

            {showCreate && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">建立新帳號</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input value={newUsername} onChange={e => setNewUsername(e.target.value)}
                            className="px-3 py-2 border rounded-lg text-sm" placeholder="帳號 *" />
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                            className="px-3 py-2 border rounded-lg text-sm" placeholder="密碼 * (至少6字元)" />
                        <input value={newName} onChange={e => setNewName(e.target.value)}
                            className="px-3 py-2 border rounded-lg text-sm" placeholder="姓名 *" />
                        <select value={newRole} onChange={e => setNewRole(e.target.value)}
                            className="px-3 py-2 border rounded-lg text-sm">
                            <option value="admin">管理員</option>
                            <option value="staff">員工</option>
                        </select>
                        <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                            className="px-3 py-2 border rounded-lg text-sm" placeholder="Email" />
                        <input value={newMobile} onChange={e => setNewMobile(e.target.value)}
                            className="px-3 py-2 border rounded-lg text-sm" placeholder="手機" />
                    </div>
                    <div className="flex gap-2 mt-3">
                        <button onClick={handleCreate} className="px-4 py-2 bg-efan-primary text-white rounded-lg text-sm font-bold hover:bg-efan-accent transition-all">建立</button>
                        <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-300 transition-all">取消</button>
                    </div>
                </div>
            )}

            {users.map(user => (
                <div key={user.id} className={`bg-gray-50 rounded-xl p-4 border border-gray-200 transition-all ${!user.isActive ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${user.isActive ? 'bg-efan-primary/10 text-efan-primary' : 'bg-gray-200 text-gray-400'}`}>
                                {user.name[0]}
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm text-gray-900">{user.name}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500">{user.role === 'admin' ? '管理員' : '員工'}</span>
                                    {!user.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">已停用</span>}
                                </div>
                                <div className="text-xs text-gray-400">@{user.username}{user.lastLoginAt && ` · 最後登入 ${new Date(user.lastLoginAt).toLocaleString('zh-TW')}`}</div>
                            </div>
                        </div>
                        <div className="flex gap-1.5">
                            <button onClick={() => { if (editingId === user.id) setEditingId(null); else { setEditingId(user.id); setChangePasswordId(null); setEditName(user.name); setEditEmail(user.email || ''); setEditMobile(user.mobile || ''); } }}
                                className="px-2.5 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-medium">✏️ 編輯</button>
                            <button onClick={() => { if (changePasswordId === user.id) setChangePasswordId(null); else { setChangePasswordId(user.id); setEditingId(null); setNewPwd(''); setConfirmPwd(''); } }}
                                className="px-2.5 py-1 text-xs bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-all font-medium">🔑 改密碼</button>
                            <button onClick={() => handleToggleActive(user)}
                                className={`px-2.5 py-1 text-xs rounded-lg transition-all font-medium ${user.isActive ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                                {user.isActive ? '⏸️ 停用登入' : '▶️ 恢復啟用'}
                            </button>
                            {authUser?.id !== user.id && (
                                <button onClick={() => handleDelete(user)}
                                    className="px-2.5 py-1 text-xs bg-rose-50 text-rose-700 rounded-lg border border-rose-100 hover:bg-rose-100 transition-all font-medium">
                                    🗑️ 刪除帳號
                                </button>
                            )}
                        </div>
                    </div>
                    {editingId === user.id && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <input value={editName} onChange={e => setEditName(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm" placeholder="姓名" />
                                <input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm" placeholder="Email" />
                                <input value={editMobile} onChange={e => setEditMobile(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm" placeholder="手機" />
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => handleEdit(user.id)} className="px-3 py-1.5 bg-efan-primary text-white rounded-lg text-xs font-bold">儲存</button>
                                <button onClick={() => setEditingId(null)} className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-xs">取消</button>
                            </div>
                        </div>
                    )}

                    {changePasswordId === user.id && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-sm">
                                <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm" placeholder="新密碼" />
                                <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="px-3 py-1.5 border rounded-lg text-sm" placeholder="確認密碼" />
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => handleChangePassword(user.id)} className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-bold">變更密碼</button>
                                <button onClick={() => setChangePasswordId(null)} className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-xs">取消</button>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
