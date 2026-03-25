import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, Loader2, XCircle, CheckCircle, Wrench, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { getUsers } from '../api/client';

const LABEL = { all: 'All', messenger: 'Messenger', whatsapp: 'WhatsApp', telegram: 'Telegram' };
const COLORS = ['bg-blue-100 text-blue-700', 'bg-purple-100 text-purple-700', 'bg-green-100 text-green-700',
    'bg-orange-100 text-orange-700', 'bg-pink-100 text-pink-700', 'bg-teal-100 text-teal-700'];
const ACTION_COLORS = { wrong: 'bg-red-50 border-red-200', right: 'bg-green-50 border-green-200', fixed: 'bg-blue-50 border-blue-200' };
const initials = (f, l) => `${(f || '?')[0]}${(l || '?')[0]}`.toUpperCase();

export default function MainContent({ platform, selectedUser, onSelectUser }) {
    const [users, setUsers] = useState([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
    const [search, setSearch] = useState('');
    const [disOnly, setDisOnly] = useState(false);
    const [unreviewedOnly, setUnreviewedOnly] = useState(false);
    const [chatAction, setChatAction] = useState(null);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showFilters, setShowFilters] = useState(false);
    const timer = useRef(null);

    const load = useCallback(async (pg = 1) => {
        setLoading(true); setError(null);
        try {
            const params = { page: pg, limit: 50 };
            if (search) params.search = search;
            if (disOnly) params.bot_active = false;
            if (unreviewedOnly) params.has_unreviewed = true;
            if (chatAction) params.chat_action = chatAction;
            const res = await getUsers(platform, params);
            setUsers(res.data);
            setMeta(res.meta);
            setPage(pg);
        } catch {
            setError('Cannot connect to backend. Please check your connection and configuration.');
        } finally {
            setLoading(false);
        }
    }, [platform, search, disOnly, unreviewedOnly, chatAction]);

    useEffect(() => { setPage(1); load(1); }, [platform, disOnly, unreviewedOnly, chatAction]);

    function handleSearch(e) {
        const v = e.target.value;
        clearTimeout(timer.current);
        timer.current = setTimeout(() => { setSearch(v); setPage(1); load(1); }, 400);
    }

    useEffect(() => { load(1); }, [search]);

    const platformLabel = LABEL[platform] ?? platform;

    return (
        <div className="flex-1 flex flex-col h-full border-r border-slate-200 bg-white overflow-hidden">

            <header className="px-4 lg:px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white sticky top-0 z-10">
                <div>
                    <h2 className="text-xl lg:text-2xl font-bold text-slate-900">{platformLabel} Users</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Manage bot interactions and user data</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-[#137fec] text-xs font-bold px-2.5 py-1 rounded-full">
                        {meta.total.toLocaleString()} Users
                    </span>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all min-h-[44px] ${
                            showFilters 
                                ? 'bg-[#137fec] text-white' 
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        <Filter className="w-4 h-4" />
                        <span className="hidden sm:inline">Filters</span>
                        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                </div>
            </header>

            {showFilters && (
                <div className="px-4 lg:px-6 pt-4 pb-2 border-b border-slate-100 bg-slate-50">
                    <div className="relative mb-4">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <Search className="w-5 h-5 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            onChange={handleSearch}
                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec] transition-all text-sm"
                            placeholder="Search user by name or ID..."
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer select-none min-h-[44px] px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors">
                            <input
                                type="checkbox"
                                checked={disOnly}
                                onChange={e => setDisOnly(e.target.checked)}
                                className="w-4 h-4 text-[#137fec] border-slate-300 rounded focus:ring-[#137fec]"
                            />
                            <span className="text-sm font-medium text-slate-700">Disabled Bot Only</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer select-none min-h-[44px] px-3 py-2 rounded-lg bg-white border border-slate-200 hover:border-slate-300 transition-colors">
                            <input
                                type="checkbox"
                                checked={unreviewedOnly}
                                onChange={e => setUnreviewedOnly(e.target.checked)}
                                className="w-4 h-4 text-amber-500 border-slate-300 rounded focus:ring-amber-500"
                            />
                            <span className="text-sm font-medium text-slate-700">Unreviewed Only</span>
                        </label>
                        <div className="h-6 w-px bg-slate-200 hidden sm:block" />
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setChatAction(null)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] ${
                                    chatAction === null ? 'bg-slate-700 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setChatAction(chatAction === 'wrong' ? null : 'wrong')}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] ${
                                    chatAction === 'wrong' ? 'bg-red-500 text-white' : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'
                                }`}
                            >
                                <XCircle className="w-4 h-4" />
                                Wrong
                            </button>
                            <button
                                onClick={() => setChatAction(chatAction === 'right' ? null : 'right')}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] ${
                                    chatAction === 'right' ? 'bg-green-500 text-white' : 'bg-white text-green-600 border border-green-200 hover:bg-green-50'
                                }`}
                            >
                                <CheckCircle className="w-4 h-4" />
                                Right
                            </button>
                            <button
                                onClick={() => setChatAction(chatAction === 'fixed' ? null : 'fixed')}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all min-h-[44px] ${
                                    chatAction === 'fixed' ? 'bg-blue-500 text-white' : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50'
                                }`}
                            >
                                <Wrench className="w-4 h-4" />
                                Fixed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4">
                {error && (
                    <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">{error}</div>
                )}

                <div className="border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                {['First Name', 'Last Name', 'User ID', 'Platform', 'Bot Respond'].map((h, i) => (
                                    <th key={h} scope="col"
                                        className={`px-4 lg:px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap ${i === 4 ? 'text-center' : 'text-left'}`}>
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
                                users.map((u) => {
                                    const active = selectedUser?.id === u.id;
                                    const color = COLORS[Number(u.id) % COLORS.length];
                                    const highlightClass = chatAction && ACTION_COLORS[chatAction] ? ACTION_COLORS[chatAction] : '';
                                    return (
                                        <tr key={u.id} onClick={() => onSelectUser(u)}
                                            className={`hover:bg-slate-50 transition-colors cursor-pointer group border-l-2
                             ${active ? 'bg-blue-50/50' : ''} ${highlightClass}`}>
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${color}`}>
                                                        {initials(u.first_name, u.last_name)}
                                                    </div>
                                                    <span className={`text-sm font-medium ${active ? 'text-[#137fec]' : 'text-slate-900 group-hover:text-[#137fec]'}`}>
                                                        {u.first_name || '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-600">{u.last_name || '—'}</td>
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">{u.platform_user_id}</td>
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-slate-500 capitalize">{u.platform}</td>
                                            <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={!!u.bot_active}
                                                    onChange={async (e) => {
                                                        const newVal = e.target.checked;
                                                        setUsers(prev => prev.map(user => user.id === u.id ? { ...user, bot_active: newVal } : user));
                                                        try {
                                                            await import('../api/client').then(m => m.toggleBot(u.id, newVal));
                                                        } catch (err) {
                                                            console.error("Failed to update bot status:", err);
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

                {meta.totalPages > 1 && !loading && (
                    <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 mt-4 pt-4 gap-3">
                        <p className="text-sm text-slate-500 text-center sm:text-left">
                            Showing <b className="text-slate-900">{(page - 1) * 10 + 1}</b> to{' '}
                            <b className="text-slate-900">{Math.min(page * 10, meta.total)}</b> of{' '}
                            <b className="text-slate-900">{meta.total}</b> results
                        </p>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                            <button onClick={() => load(page - 1)} disabled={page <= 1}
                                className="relative inline-flex items-center rounded-l-md px-3 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-40 min-h-[44px]">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {[...Array(Math.min(meta.totalPages, 5))].map((_, i) => {
                                const n = Math.max(1, Math.min(page - 2, meta.totalPages - 4)) + i;
                                return (
                                    <button key={n} onClick={() => load(n)}
                                        className={`relative inline-flex items-center px-3 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-300 min-h-[44px]
                      ${n === page ? 'bg-[#137fec] text-white z-10' : 'text-slate-900 hover:bg-slate-50'}`}>
                                        {n}
                                    </button>
                                );
                            })}
                            <button onClick={() => load(page + 1)} disabled={page >= meta.totalPages}
                                className="relative inline-flex items-center rounded-r-md px-3 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-40 min-h-[44px]">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </div>
    );
}
