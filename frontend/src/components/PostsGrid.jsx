import { useState, useEffect, useCallback } from 'react';
import { Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getPosts, createPost, updatePost } from '../api/client';

const LIMIT = 10;

function formatDate(ts) {
    if (!ts) return '—';
    try {
        return new Date(ts).toLocaleString();
    } catch {
        return '—';
    }
}

export default function PostsGrid() {
    const [posts, setPosts] = useState([]);
    const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [addSaving, setAddSaving] = useState(false);
    const [addForm, setAddForm] = useState({ message: '', product_url: '', availability: true, sku: '' });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ message: '', product_url: '', sku: '' });

    const load = useCallback(async (pg = 1) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getPosts({ page: pg, limit: LIMIT });
            setPosts(res.data);
            setMeta(res.meta);
            setPage(pg);
        } catch (e) {
            setError('Cannot connect to backend. Please check your connection and configuration.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(page);
    }, [page, load]);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setAddSaving(true);
        try {
            await createPost({
                message: addForm.message || null,
                product_url: addForm.product_url || null,
                availability: addForm.availability,
                sku: addForm.sku || null,
            });
            setShowAddForm(false);
            setAddForm({ message: '', product_url: '', availability: true, sku: '' });
            load(page);
        } catch (err) {
            console.error(err);
            alert('Failed to create post');
        } finally {
            setAddSaving(false);
        }
    };

    const startEdit = (post) => {
        setEditingId(post.id);
        setEditForm({
            message: post.message ?? '',
            product_url: post.product_url ?? '',
            sku: post.sku ?? '',
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({ message: '', product_url: '', sku: '' });
    };

    const saveEdit = async () => {
        if (editingId == null) return;
        const payload = {};
        if (editForm.message !== undefined) payload.message = editForm.message || null;
        if (editForm.product_url !== undefined) payload.product_url = editForm.product_url || null;
        if (editForm.sku !== undefined) payload.sku = editForm.sku || null;
        if (Object.keys(payload).length === 0) {
            setEditingId(null);
            return;
        }
        try {
            const updated = await updatePost(editingId, payload);
            setPosts((prev) => prev.map((p) => (p.id === editingId ? { ...p, ...updated } : p)));
            setEditingId(null);
        } catch (err) {
            console.error(err);
            alert('Failed to update post');
        }
    };

    const handleAvailabilityChange = async (post, newVal) => {
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, availability: newVal } : p)));
        try {
            await updatePost(post.id, { availability: newVal });
        } catch (err) {
            console.error(err);
            setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, availability: !newVal } : p)));
            alert('Failed to update availability');
        }
    };

    return (
        <main className="flex-1 flex flex-col h-screen min-w-[500px] border-r border-slate-200 bg-white overflow-hidden">
            <header className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Posts</h2>
                    <p className="text-sm text-slate-500 mt-1">Manage posts (message, product URL, availability)</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="bg-blue-100 text-[#137fec] text-xs font-bold px-2.5 py-1 rounded-full">
                        {meta.total.toLocaleString()} Posts
                    </span>
                    <button
                        type="button"
                        onClick={() => setShowAddForm(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#137fec] text-white text-sm font-medium hover:bg-[#0d6bc9] transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add post
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-4">
                {error && (
                    <div className="mb-4 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                        {error}
                    </div>
                )}

                {editingId != null && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={cancelEdit}>
                        <div
                            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">Edit post</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Message</label>
                                    <input
                                        type="text"
                                        value={editForm.message}
                                        onChange={(e) => setEditForm((f) => ({ ...f, message: e.target.value }))}
                                        className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Product URL</label>
                                    <input
                                        type="text"
                                        value={editForm.product_url}
                                        onChange={(e) => setEditForm((f) => ({ ...f, product_url: e.target.value }))}
                                        className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">SKU</label>
                                    <input
                                        type="number"
                                        value={editForm.sku}
                                        onChange={(e) => setEditForm((f) => ({ ...f, sku: e.target.value }))}
                                        className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec]"
                                        placeholder="Optional integer"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={saveEdit}
                                    className="px-4 py-2 bg-[#137fec] text-white text-sm font-medium rounded-lg hover:bg-[#0d6bc9]"
                                >
                                    Save
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showAddForm && (
                    <div className="mb-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">New post</h3>
                        <form onSubmit={handleAddSubmit} className="space-y-3 max-w-md">
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Message</label>
                                <input
                                    type="text"
                                    value={addForm.message}
                                    onChange={(e) => setAddForm((f) => ({ ...f, message: e.target.value }))}
                                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">Product URL</label>
                                <input
                                    type="text"
                                    value={addForm.product_url}
                                    onChange={(e) => setAddForm((f) => ({ ...f, product_url: e.target.value }))}
                                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-500 mb-1">SKU</label>
                                <input
                                    type="number"
                                    value={addForm.sku}
                                    onChange={(e) => setAddForm((f) => ({ ...f, sku: e.target.value }))}
                                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-[#137fec]/50 focus:border-[#137fec]"
                                    placeholder="Optional integer"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="add-availability"
                                    checked={addForm.availability}
                                    onChange={(e) => setAddForm((f) => ({ ...f, availability: e.target.checked }))}
                                    className="h-4 w-4 text-[#137fec] border-slate-300 rounded"
                                />
                                <label htmlFor="add-availability" className="text-sm text-slate-700">
                                    Availability
                                </label>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={addSaving}
                                    className="px-4 py-2 bg-[#137fec] text-white text-sm font-medium rounded-lg hover:bg-[#0d6bc9] disabled:opacity-50"
                                >
                                    {addSaving ? 'Saving…' : 'Create'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                    setShowAddForm(false);
                                        setAddForm({ message: '', product_url: '', availability: true, sku: '' });
                                    }}
                                    className="px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
                                    ID
                                </th>
                                <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
                                    Post URL
                                </th>
                                <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
                                    Message
                                </th>
                                <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
                                    Product URL
                                </th>
                                <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
                                    SKU
                                </th>
                                <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                                    Availability
                                </th>
                                <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left">
                                    Created at
                                </th>
                                <th scope="col" className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-left w-20">
                                    Edit
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center">
                                        <div className="flex items-center justify-center gap-2 text-slate-400">
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="text-sm">Loading…</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : posts.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-slate-400 text-sm">
                                        No posts yet. Click &quot;Add post&quot; to create one.
                                    </td>
                                </tr>
                            ) : (
                                posts.map((post) => (
                                        <tr key={post.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 font-mono">
                                                {post.id}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 max-w-[180px] truncate" title={post.post_url || ''}>
                                                {post.post_url ? (
                                                    <a
                                                        href={post.post_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[#137fec] hover:underline truncate block"
                                                    >
                                                        {post.post_url}
                                                    </a>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-900">
                                                <span className="block max-w-[200px] truncate" title={post.message ?? ''}>
                                                    {post.message ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">
                                                <span className="block max-w-[180px] truncate" title={post.product_url ?? ''}>
                                                    {post.product_url ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 font-mono">
                                                {post.sku ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={!!post.availability}
                                                    onChange={(e) => handleAvailabilityChange(post, e.target.checked)}
                                                    className="h-5 w-5 text-[#137fec] border-slate-300 rounded focus:ring-[#137fec] cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                                                {formatDate(post.created_at)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(post)}
                                                    className="text-xs px-2 py-1 text-[#137fec] hover:bg-blue-50 rounded"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                        </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {meta.totalPages > 1 && !loading && (
                    <div className="flex items-center justify-between border-t border-slate-200 mt-4 pt-4">
                        <p className="text-sm text-slate-500">
                            Showing <b className="text-slate-900">{(page - 1) * LIMIT + 1}</b> to{' '}
                            <b className="text-slate-900">{Math.min(page * LIMIT, meta.total)}</b> of{' '}
                            <b className="text-slate-900">{meta.total}</b> results
                        </p>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm">
                            <button
                                onClick={() => load(page - 1)}
                                disabled={page <= 1}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {[...Array(Math.min(meta.totalPages, 5))].map((_, i) => {
                                const n = Math.max(1, Math.min(page - 2, meta.totalPages - 4)) + i;
                                return (
                                    <button
                                        key={n}
                                        onClick={() => load(n)}
                                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-300 ${n === page ? 'bg-[#137fec] text-white z-10' : 'text-slate-900 hover:bg-slate-50'
                                            }`}
                                    >
                                        {n}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => load(page + 1)}
                                disabled={page >= meta.totalPages}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 disabled:opacity-40"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </nav>
                    </div>
                )}
            </div>
        </main>
    );
}
