const BASE = import.meta.env.VITE_API_URL;

async function req(url, opts = {}) {
    const res = await fetch(BASE + url, opts);
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

export const getUsers = (platform, params = {}) => {
    const qs = new URLSearchParams({ platform, page: 1, limit: 10, ...params });
    Object.keys(params).forEach(k => params[k] == null && qs.delete(k));
    return req(`/users?${qs}`);
};

export const getMessages = (userId) => req(`/messages/${userId}`);

export const updateAction = (id, action, feedback = null) =>
    req(`/messages/${id}/action`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, feedback }),
    });

export const toggleBot = (id, bot_active) =>
    req(`/users/${id}/bot`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_active }),
    });

export const getPosts = (params = {}) => {
    const qs = new URLSearchParams({ page: 1, limit: 10, ...params });
    Object.keys(params).forEach(k => params[k] == null && qs.delete(k));
    return req(`/posts?${qs}`);
};

export const createPost = ({ message, product_url, availability }) =>
    req('/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, product_url, availability }),
    });

export const updatePost = (id, payload) =>
    req(`/posts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
