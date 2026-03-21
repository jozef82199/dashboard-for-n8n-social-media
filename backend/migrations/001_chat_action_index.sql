-- Index for chat history action filtering
-- Run this to optimize queries filtering by note->>'action' and message->>'type'

CREATE INDEX IF NOT EXISTS idx_chat_note_action 
ON n8n_chat_histories ((note::jsonb->>'action'), (message->>'type'));
