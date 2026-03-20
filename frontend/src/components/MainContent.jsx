import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Bot, ChevronLeft, ChevronRight, Loader2, MessageSquareWarning } from 'lucide-react';
import { getUsers } from '../api/client';

const LABEL = { all: 'All', messenger: 'Messenger', whatsapp: 'WhatsApp', telegram: 'Telegram' };
const COLORS = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-green-100 text-green-700',
    'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700', 'bg-teal-100 text-teal-700'];
const initials = (f, l) => `${(f || '?')[0]}${(l || '?')[0]}`.toUpperCase();

export default function MainContent({ platform, selectedUser, onSelectUser }) {
    const [users, setUsers] = useState([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [disOnly, setDisOnly] = useState(false);
    const [unreviewedOnly, setUnreviewedOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const timer = useRef(null);

    const load = useCallback(async (pg = 1) => {
        setLoading(true); setError(null);
        try {
            const params = { page: pg, limit: 15 };
            if (search) params.search = search;
            if (disOnly) params.bot_active = false;
            if (unreviewedOnly) params.has_unreviewed = true;
            const res = await getUsers(platform, params);
            setUsers(res.data);
            setMeta(res.meta);
            setPage(pg);
        } catch (e) {
            setError('Cannot connect to backend. Please check your connection and configuration.');
        } finally {
            setLoading(false);
        }
    }, [platform, search, disOnly, unreviewedOnly]);

    // reload when platform / filter changes
    useEffect(() => { setPage(1); load(1); }, [platform, disOnly, unreviewedOnly]);

    // debounce search
    function handleSearch(e) {
        const v = e.target.value;
        clearTimeout(timer.current);
        timer.current = setTimeout(() => { setSearch(v); setPage(1); load(1); }, 400);
    }

    // when search ref changes
    useEffect(() => { load(1); }, [search]);

    const platformLabel = LABEL[platform] ?? platform;

    return (
        <main className="flex-1 flex flex-col h-screen min-w-[500px] border-r border-slate-200 bg-white overflow-hidden">

            {/* Header */}
            <header className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{platformLabel} Users</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage bot interactions and user data</p>
                </div>
                <span className="bg-blue-100 text-[#137fec] text-xs font-bold px-2.5 py-1 rounded-full">
                    {meta.total.toLocaleString()} Users
                </span>
            </header>

            {/* Filters */}
            <div className="px-6 pt-6 pb-2 space-y-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-slate-400" />
                    </div>
                    <input
                        type="text"
                        onChange={handleSearch}
                        className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg bg-slate-100 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#137fec]/50 focus:bg-white transition-all text-sm"
                        placeholder="Search user by name or ID..."
                    />
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                            <Bot className="w-5 h-5 text-slate-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Show Disabled Bot Respond Only</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input type="checkbox" className="sr-only peer" checked={disOnly} onChange={e => setDisOnly(e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-[#137fec]/20 rounded-full peer
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300
                            after:rounded-full after:h-5 after:w-5 after:transition-all
                            peer-checked:bg-[#137fec] peer-checked:after:translate-x-full peer-checked:after:border-white" />
                    </label>
                </div>

                <div className="flex items-center justify-between bg-amber-50 p-3 rounded-lg border border-amber-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                            <MessageSquareWarning className="w-5 h-5 text-amber-600" />
                        </div>
                        <span className="text-sm font-medium text-slate-700">Show Not reviewed Messages</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input type="checkbox" className="sr-only peer" checked={unreviewedOnly} onChange={e => setUnreviewedOnly(e.target.checked)} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-amber-500/20 rounded-full peer
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300
                            after:rounded-full after:h-5 after:w-5 after:transition-all
                            peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white" />
                    </label>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
                {error && (
                    <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{error}</div>
                )}

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                {['First Name', 'Last Name', 'User ID', 'Platform', 'Bot Respond'].map((h, i) => (
                                    <th key={h} scope="col"
                                        className={`px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider ${i === 4 ? 'text-center' : 'text-left'}`}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center">
                                    <div className="flex items-center justify-center gap-2 text-slate-400">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        <span className="text-sm">Loading…</span>
                                    </div>
                                </td></tr>
                            ) : users.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm">No users found.</td></tr>
                            ) : (
                                users.map((u, idx) => {
                                    const active = selectedUser?.id === u.id;
                                    const color = COLORS[Number(u.id) % COLORS.length];
                                    return (
                                        <tr key={u.id} onClick={() => onSelectUser(u)}
                                            className={`hover:bg-slate-50 transition-colors cursor-pointer group
                        ${active ? 'bg-blue-50/50' : ''}`}>
                                            {/* First Name */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${color}`}>
                                                        {initials(u.first_name, u.last_name)}
                                                    </div>
                                                    <span className={`text-sm font-medium ${active ? 'text-[#137fec]' : 'text-slate-900 group-hover:text-[#137fec]'}`}>
                                                        {u.first_name || '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            {/* Last Name */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{u.last_name || '—'}</td>
                                            {/* Platform User ID */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{u.platform_user_id}</td>
                                            {/* Platform */}
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{u.platform}</td>
                                            {/* Bot Respond checkbox */}
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={!!u.bot_active}
                                                    onChange={async (e) => {
                                                        const newVal = e.target.checked;
                                                        // optimistic update
                                                        setUsers(prev => prev.map(user => user.id === u.id ? { ...user, bot_active: newVal } : user));
                                                        try {
                                                            await import('../api/client').then(m => m.toggleBot(u.id, newVal));
                                                        } catch (err) {
                                                            console.error("Failed to update bot status:", err);
                                                            // revert
                                                            setUsers(prev => prev.map(user => user.id === u.id ? { ...user, bot_active: !newVal } : user));
                                                            alert('Failed to update bot status');
                                                        }
                                                    }}
                                                    onClick={e => e.stopPropagation()}
                                                    className="h-5 w-5 text-[#137fec] border-slate-300 rounded focus:ring-[#137fec] cursor-pointer"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {meta.totalPages > 1 && !loading && (
                    <div className="flex items-center justify-between border-t border-slate-200 mt-4 pt-4">
                        <p className="text-sm text-slate-500">
                            Showing <b className="text-slate-900">{(page - 1) * 10 + 1}</b> to{' '}
                            <b className="text-slate-900">{Math.min(page * 10, meta.total)}</b> of{' '}
                            <b className="text-slate-900">{meta.total}</b> results
                        </p>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                            <button onClick={() => load(page - 1)} disabled={page <= 1}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-40">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {[...Array(Math.min(meta.totalPages, 5))].map((_, i) => {
                                const n = Math.max(1, Math.min(page - 2, meta.totalPages - 4)) + i;
                                return (
                                    <button key={n} onClick={() => load(n)}
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-300
                      ${n === page ? 'bg-[#137fec] text-white z-10' : 'text-slate-900 hover:bg-slate-50'}`}>
                                        {n}
                                    </button>
                                );
                            })}
                            <button onClick={() => load(page + 1)} disabled={page >= meta.totalPages}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-40">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </main>
    );
}
