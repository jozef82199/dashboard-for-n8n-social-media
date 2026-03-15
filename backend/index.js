import express from 'express';
import cors from 'cors';
import pool from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── 1. Get Users (filtered + paginated) ──────────────────────────────────────
app.get('/api/users', async (req, res) => {
    try {
        const { platform = 'all', bot_active, search, page = 1, limit = 10 } = req.query;

        let botVal = null;
        if (bot_active === 'true') botVal = true;
        if (bot_active === 'false') botVal = false;

        const searchVal = search || null;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        const q = `
      SELECT id, platform, phone_number, platform_user_id, first_name, last_name, bot_active
      FROM backpacker_users
      WHERE ($1::text = 'all' OR platform = $1::text)
        AND ($2::boolean IS NULL OR bot_active = $2)
        AND ($3::text IS NULL
             OR first_name     ILIKE '%' || $3 || '%'
             OR last_name      ILIKE '%' || $3 || '%'
             OR platform_user_id ILIKE '%' || $3 || '%'
             OR phone_number   ILIKE '%' || $3 || '%')
      ORDER BY id DESC
      LIMIT $4 OFFSET $5;
    `;
        const cq = `
      SELECT COUNT(*)
      FROM backpacker_users
      WHERE ($1::text = 'all' OR platform = $1::text)
        AND ($2::boolean IS NULL OR bot_active = $2)
        AND ($3::text IS NULL
             OR first_name     ILIKE '%' || $3 || '%'
             OR last_name      ILIKE '%' || $3 || '%'
             OR platform_user_id ILIKE '%' || $3 || '%'
             OR phone_number   ILIKE '%' || $3 || '%');
    `;

        const [data, count] = await Promise.all([
            pool.query(q, [platform, botVal, searchVal, limitNum, offset]),
            pool.query(cq, [platform, botVal, searchVal]),
        ]);

        res.json({
            data: data.rows,
            meta: {
                total: parseInt(count.rows[0].count),
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(parseInt(count.rows[0].count) / limitNum),
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ── 2. Get Conversation Messages ──────────────────────────────────────────────
// session_id in n8n_chat_histories contains the platform_user_id
app.get('/api/messages/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Get platform_user_id for this DB user
        const userRes = await pool.query(
            'SELECT platform_user_id FROM backpacker_users WHERE id = $1',
            [userId]
        );
        if (!userRes.rows.length) return res.status(404).json({ error: 'User not found' });

        const pid = userRes.rows[0].platform_user_id;

        // Fetch messages – only human / ai types, ordered oldest first
        const result = await pool.query(
            `SELECT id, session_id, message, note
       FROM n8n_chat_histories
       WHERE session_id ILIKE '%' || $1 || '%'
         AND message->>'type' IN ('human','ai')
         AND (message->>'content' IS NOT NULL AND message->>'content' <> '' AND message->>'content' <> '[]')
       ORDER BY id ASC`,
            [pid]
        );

        const messages = result.rows.map(row => {
            // Parse saved review note
            let action = null, feedback = null;
            try {
                if (row.note) {
                    const n = JSON.parse(row.note);
                    action = n.action ?? null;
                    feedback = n.feedback ?? null;
                }
            } catch { /* legacy plain-text notes */ feedback = row.note; }

            // Flatten content (may be string or array)
            let content = '';
            const raw = row.message?.content;
            if (typeof raw === 'string') content = raw;
            else if (Array.isArray(raw)) content = raw.map(c => (typeof c === 'string' ? c : c?.text ?? '')).join(' ');

            return {
                id: row.id,
                user_id: userId,
                sender: row.message?.type === 'human' ? 'user' : 'bot',
                content: content.trim(),
                action,
                feedback,
            };
        });

        res.json(messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ── 3. Update Message Action / Feedback ──────────────────────────────────────
app.put('/api/messages/:id/action', async (req, res) => {
    try {
        const { id } = req.params;
        const { action = null, feedback = null } = req.body;

        const note = JSON.stringify({ action, feedback });
        const result = await pool.query(
            'UPDATE n8n_chat_histories SET note = $1 WHERE id = $2 RETURNING id',
            [note, id]
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Message not found' });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ── 4. Toggle bot_active ──────────────────────────────────────────────────────
app.patch('/api/users/:id/bot', async (req, res) => {
    try {
        const { id } = req.params;
        const { bot_active } = req.body;
        await pool.query('UPDATE backpacker_users SET bot_active = $1 WHERE id = $2', [bot_active, id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

// ── 5. Posts (list, create, update only) ───────────────────────────────────────
app.get('/api/posts', async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const offset = (pageNum - 1) * limitNum;

        const [data, count] = await Promise.all([
            pool.query(
                `SELECT id, post_url, message, product_url, availability, created_at
                 FROM posts
                 ORDER BY id DESC
                 LIMIT $1 OFFSET $2`,
                [limitNum, offset]
            ),
            pool.query('SELECT COUNT(*) FROM posts'),
        ]);

        const total = parseInt(count.rows[0].count);
        res.json({
            data: data.rows,
            meta: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum),
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/posts', async (req, res) => {
    try {
        const { message = null, product_url = null, availability = true } = req.body;
        const result = await pool.query(
            `INSERT INTO posts (message, product_url, availability)
             VALUES ($1, $2, $3)
             RETURNING id, post_url, message, product_url, availability, created_at`,
            [message, product_url, availability]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.patch('/api/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { message, product_url, availability } = req.body;

        const updates = [];
        const values = [];
        let idx = 1;
        if (message !== undefined) {
            updates.push(`message = $${idx++}`);
            values.push(message);
        }
        if (product_url !== undefined) {
            updates.push(`product_url = $${idx++}`);
            values.push(product_url);
        }
        if (availability !== undefined) {
            updates.push(`availability = $${idx++}`);
            values.push(availability);
        }
        if (updates.length === 0) {
            const row = await pool.query(
                'SELECT id, post_url, message, product_url, availability, created_at FROM posts WHERE id = $1',
                [id]
            );
            if (!row.rows.length) return res.status(404).json({ error: 'Post not found' });
            return res.json(row.rows[0]);
        }
        values.push(id);
        const result = await pool.query(
            `UPDATE posts SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, post_url, message, product_url, availability, created_at`,
            values
        );
        if (!result.rows.length) return res.status(404).json({ error: 'Post not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
