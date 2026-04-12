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

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [authUser, setAuthUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [changePasswordId, setChangePasswordId] = useState<string | null>(null);

    // Create form
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('admin');
    const [newEmail, setNewEmail] = useState('');
    const [newMobile, setNewMobile] = useState('');

    // Edit form
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [editMobile, setEditMobile] = useState('');

    // Change password form
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
        if (!newUsername || !newPassword || !newName) {
            alert('帳號、密碼、姓名為必填');
            return;
        }
        try {
            const res = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: newUsername,
                    password: newPassword,
                    name: newName,
                    role: newRole,
                    email: newEmail,
                    mobile: newMobile,
                }),
            });
            if (res.ok) {
                alert('✅ 帳號建立成功');
                setShowCreate(false);
                setNewUsername(''); setNewPassword(''); setNewName('');
                setNewEmail(''); setNewMobile('');
                fetchUsers();
            } else {
                const err = await res.json();
                alert(`❌ ${err.error}`);
            }
        } catch (e) { alert('❌ 建立失敗'); }
    };

    const handleEdit = async (id: string) => {
        try {
            const res = await fetch(`/api/users/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName, email: editEmail, mobile: editMobile }),
            });
            if (res.ok) {
                alert('✅ 已更新');
                setEditingId(null);
                fetchUsers();
            } else {
                const err = await res.json();
                alert(`❌ ${err.error}`);
            }
        } catch (e) { alert('❌ 更新失敗'); }
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
            if (res.ok) {
                alert('✅ 密碼已變更');
                setChangePasswordId(null);
                setNewPwd(''); setConfirmPwd('');
            } else {
                const err = await res.json();
                alert(`❌ ${err.error}`);
            }
        } catch (e) { alert('❌ 變更失敗'); }
    };

    const handleToggleActive = async (user: User) => {
        if (!confirm(`確定要${user.isActive ? '停用' : '啟用'} ${user.name} 嗎？`)) return;
        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !user.isActive }),
            });
            if (res.ok) {
                fetchUsers();
            } else {
                const err = await res.json();
                alert(`❌ ${err.error}`);
            }
        } catch (e) { alert('❌ 操作失敗'); }
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
        } catch (e) { alert('❌ 刪除失敗'); }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-efan-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">帳號管理</h1>
                    <p className="text-sm text-gray-500 mt-1">管理後台登入帳戶、變更密碼</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="px-5 py-2.5 bg-efan-primary text-white rounded-xl font-bold hover:bg-efan-accent transition-all shadow-lg shadow-efan-primary/25"
                >
                    + 新增帳號
                </button>
            </div>

            {/* Create Form */}
            {showCreate && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">建立新帳號</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">帳號 *</label>
                            <input
                                value={newUsername} onChange={e => setNewUsername(e.target.value)}
                                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-efan-primary/50 focus:border-efan-primary"
                                placeholder="請輸入登入帳號"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">密碼 *</label>
                            <input
                                type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-efan-primary/50 focus:border-efan-primary"
                                placeholder="至少 6 個字元"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                            <input
                                value={newName} onChange={e => setNewName(e.target.value)}
                                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-efan-primary/50 focus:border-efan-primary"
                                placeholder="顯示名稱"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                            <select
                                value={newRole} onChange={e => setNewRole(e.target.value)}
                                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-efan-primary/50 focus:border-efan-primary"
                            >
                                <option value="admin">管理員</option>
                                <option value="staff">員工</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-efan-primary/50 focus:border-efan-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">手機</label>
                            <input
                                value={newMobile} onChange={e => setNewMobile(e.target.value)}
                                className="w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-efan-primary/50 focus:border-efan-primary"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-5">
                        <button onClick={handleCreate}
                            className="px-6 py-2.5 bg-efan-primary text-white rounded-xl font-bold hover:bg-efan-accent transition-all">
                            建立
                        </button>
                        <button onClick={() => setShowCreate(false)}
                            className="px-6 py-2.5 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all">
                            取消
                        </button>
                    </div>
                </div>
            )}

            {/* User List */}
            <div className="space-y-4">
                {users.map(user => (
                    <div key={user.id}
                        className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md ${!user.isActive ? 'opacity-60' : ''}`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${user.isActive ? 'bg-efan-primary/10 text-efan-primary' : 'bg-gray-200 text-gray-400'}`}>
                                    {user.name[0]}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-900">{user.name}</span>
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                            {user.role === 'admin' ? '管理員' : '員工'}
                                        </span>
                                        {!user.isActive && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">已停用</span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-0.5">
                                        @{user.username}
                                        {user.email && <span className="ml-3">{user.email}</span>}
                                        {user.mobile && <span className="ml-3">{user.mobile}</span>}
                                    </div>
                                    {user.lastLoginAt && (
                                        <div className="text-xs text-gray-400 mt-1">
                                            最後登入：{new Date(user.lastLoginAt).toLocaleString('zh-TW')}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => {
                                    if (editingId === user.id) { setEditingId(null); }
                                    else {
                                        setEditingId(user.id); setChangePasswordId(null);
                                        setEditName(user.name); setEditEmail(user.email || ''); setEditMobile(user.mobile || '');
                                    }
                                }}
                                    className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all font-medium">
                                    ✏️ 編輯
                                </button>
                                <button onClick={() => {
                                    if (changePasswordId === user.id) { setChangePasswordId(null); }
                                    else { setChangePasswordId(user.id); setEditingId(null); setNewPwd(''); setConfirmPwd(''); }
                                }}
                                    className="px-3 py-1.5 text-sm bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-all font-medium">
                                    🔑 改密碼
                                </button>
                                <button onClick={() => handleToggleActive(user)}
                                    className={`px-3 py-1.5 text-sm rounded-lg transition-all font-medium ${user.isActive
                                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                    }`}>
                                    {user.isActive ? '⏸️ 停用登入' : '▶️ 恢復啟用'}
                                </button>
                                {authUser?.id !== user.id && (
                                    <button onClick={() => handleDelete(user)}
                                        className="px-3 py-1.5 text-sm bg-rose-50 text-rose-700 rounded-lg border border-rose-100 hover:bg-rose-100 transition-all font-medium">
                                        🗑️ 刪除帳號
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* Edit Form */}
                        {editingId === user.id && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">姓名</label>
                                        <input value={editName} onChange={e => setEditName(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-efan-primary/50" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                                        <input value={editEmail} onChange={e => setEditEmail(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-efan-primary/50" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">手機</label>
                                        <input value={editMobile} onChange={e => setEditMobile(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-efan-primary/50" />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => handleEdit(user.id)}
                                        className="px-4 py-2 bg-efan-primary text-white rounded-lg text-sm font-bold hover:bg-efan-accent transition-all">
                                        儲存
                                    </button>
                                    <button onClick={() => setEditingId(null)}
                                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-all">
                                        取消
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Change Password Form */}
                        {changePasswordId === user.id && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">新密碼</label>
                                        <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-efan-primary/50"
                                            placeholder="至少 6 個字元" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">確認密碼</label>
                                        <input type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)}
                                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-efan-primary/50"
                                            placeholder="再輸入一次" />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-3">
                                    <button onClick={() => handleChangePassword(user.id)}
                                        className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-bold hover:bg-amber-600 transition-all">
                                        變更密碼
                                    </button>
                                    <button onClick={() => setChangePasswordId(null)}
                                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-all">
                                        取消
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
