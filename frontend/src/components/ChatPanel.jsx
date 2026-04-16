import { useState, useReducer, useEffect, useRef } from 'react';
import { MoreHorizontal, Bot, Send, Pencil, Loader2, MessageSquare, ArrowLeft } from 'lucide-react';
import { getMessages, updateAction } from '../api/client';
import ReactMarkdown from 'react-markdown';

const PLAT_LABEL = { telegram: 'Telegram', whatsapp: 'WhatsApp', messenger: 'Messenger' };
const initials = (f, l) => `${(f || '?')[0]}${(l || '?')[0]}`.toUpperCase();
const hasArabic = (text) => /[\u0600-\u06FF]/.test(text || '');

const chatInitialState = { messages: [], loading: false, error: null };

function chatReducer(state, action) {
    switch (action.type) {
        case 'fetch': return { messages: [], loading: true, error: null };
        case 'success': return { messages: action.payload, loading: false, error: null };
        case 'error': return { ...state, loading: false, error: 'Failed to load messages.' };
        case 'reset': return chatInitialState;
        default: return state;
    }
}

function MessageContent({ content }) {
    const isArabic = hasArabic(content);
    return (
        <div className={`prose prose-sm max-w-none break-words ${isArabic ? 'text-right' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
            <ReactMarkdown
                components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc mb-2 pl-4 rtl:pr-4 rtl:pl-0">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal mb-2 pl-4 rtl:pr-4 rtl:pl-0">{children}</ol>,
                    li: ({ children }) => <li className="mb-1">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    code: ({ children }) => <code className="bg-slate-100 px-1 py-0.5 rounded text-xs">{children}</code>,
                    pre: ({ children }) => <pre className="bg-slate-100 p-2 rounded mb-2 overflow-x-auto text-xs">{children}</pre>,
                    a: ({ href, children }) => <a href={href} className="text-[#137fec] underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                }}
            >
                {content || ''}
            </ReactMarkdown>
        </div>
    );
}

function MsgActions({ msg }) {
    const [action, setAction] = useState(msg.action ?? 'no_action');
    const [feedback, setFeedback] = useState(msg.feedback ?? '');
    const saving = useRef(false);

    async function save(a, fb) {
        if (saving.current) return;
        saving.current = true;
        try { await updateAction(msg.id, a === 'no_action' ? null : a, a === 'wrong' ? fb : null); }
        catch (e) { console.error('save failed', e); }
        finally { saving.current = false; }
    }

    function onAction(a) {
        setAction(a);
        save(a, feedback);
    }

    function onFeedbackBlur() {
        save(action, feedback);
    }

    const opts = [
        { val: 'no_action', label: 'No Action', cls: 'text-slate-400', ring: 'focus:ring-slate-400' },
        { val: 'right', label: 'Right', cls: 'text-green-500', ring: 'focus:ring-green-500' },
        { val: 'wrong', label: 'Wrong', cls: 'text-red-500', ring: 'focus:ring-red-500' },
        { val: 'fixed', label: 'Fixed', cls: 'text-blue-500', ring: 'focus:ring-blue-500' },
    ];

    return (
        <div className="flex flex-col gap-2 mt-1">
            <div className="flex flex-wrap items-center gap-3 px-1">
                {opts.map(({ val, label, cls, ring }) => (
                    <label key={val} className="flex items-center gap-1.5 cursor-pointer group select-none min-h-[44px]">
                        <input
                            type="radio"
                            name={`msg-${msg.id}`}
                            checked={action === val}
                            onChange={() => onAction(val)}
                            className={`w-4 h-4 border-slate-300 cursor-pointer ${cls} ${ring}`}
                        />
                        <span className={`text-xs font-medium uppercase tracking-wide
              ${action === val && val !== 'no_action'
                                ? (val === 'right' ? 'text-green-600' : val === 'wrong' ? 'text-red-500' : 'text-blue-500')
                                : 'text-slate-400 group-hover:text-slate-600'}`}>
                            {label}
                        </span>
                    </label>
                ))}
            </div>

            {action === 'wrong' && (
                <div className="ml-1 w-full">
                    <div className="flex items-center gap-1 mb-1 text-red-500 text-xs font-semibold uppercase tracking-wide">
                        <Pencil className="w-3 h-3" /> Feedback Note
                    </div>
                    <textarea
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        onBlur={onFeedbackBlur}
                        rows={2}
                        placeholder="Explain why this response is incorrect..."
                        className="w-full text-xs border border-slate-200 bg-white rounded p-2 focus:ring-2 focus:ring-red-100 focus:border-red-300 resize-none"
                    />
                </div>
            )}
        </div>
    );
}

export default function ChatPanel({ selectedUser, chatOpen, onCloseChat }) {
    const [{ messages, loading, error }, dispatch] = useReducer(chatReducer, chatInitialState);
    const bottomRef = useRef(null);

    useEffect(() => {
        if (!selectedUser) {
            dispatch({ type: 'reset' });
            return;
        }
        let cancelled = false;
        dispatch({ type: 'fetch' });
        getMessages(selectedUser.id)
            .then((data) => { if (!cancelled) dispatch({ type: 'success', payload: data }); })
            .catch(() => { if (!cancelled) dispatch({ type: 'error' }); });
        return () => { cancelled = true; };
    }, [selectedUser?.id]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const ini = selectedUser ? initials(selectedUser.first_name, selectedUser.last_name) : '??';

    return (
        <aside
            className={`
                fixed lg:static inset-y-0 right-0 z-40
                w-full lg:w-[26rem] bg-[#f6f7f8] flex flex-col shrink-0 border-l border-slate-200 h-full
                transform transition-transform duration-300 ease-in-out
                ${chatOpen ? 'translate-x-0' : 'translate-x-full'}
                lg:translate-x-0
            `}
        >
            <div className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-slate-200 bg-white shrink-0">
                {selectedUser ? (
                    <>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onCloseChat}
                                className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-[#137fec] font-bold text-xs">
                                {ini}
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-slate-900">
                                    {selectedUser.first_name} {selectedUser.last_name}
                                </h3>
                                <p className="text-xs text-slate-500 capitalize">
                                    {PLAT_LABEL[selectedUser.platform] ?? selectedUser.platform} User
                                </p>
                            </div>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </>
                ) : (
                    <p className="text-sm text-slate-400">Select a user to view messages</p>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {!selectedUser ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-300">
                        <MessageSquare className="w-10 h-10" />
                        <p className="text-sm">No user selected</p>
                    </div>
                ) : loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-sm">Loading messages…</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-100 text-red-500 text-sm p-3 rounded-lg">{error}</div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-300">
                        <MessageSquare className="w-10 h-10" />
                        <p className="text-sm">No messages found for this user.</p>
                    </div>
                ) : (
                    messages.map(msg => {
                        const isUser = msg.sender === 'user';
                        return (
                            <div key={msg.id}
                                className={`flex gap-3 max-w-[90%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>

                                {isUser ? (
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center text-[#137fec] text-xs font-bold">
                                        {ini}
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-[#137fec]/10 flex-shrink-0 flex items-center justify-center text-[#137fec]">
                                        <Bot className="w-4 h-4" />
                                    </div>
                                )}

                                <div className={`flex flex-col gap-1 w-full ${isUser ? 'items-end' : ''}`}>
                                    <div className={`p-3 text-sm shadow-sm leading-relaxed
                    ${isUser
                                            ? 'bg-[#137fec] text-white rounded-2xl rounded-tr-none'
                                            : 'bg-white text-slate-700 rounded-2xl rounded-tl-none border border-slate-100'}`}>
                                        {isUser
                                            ? (msg.content || <span className="italic text-slate-300 text-xs">[empty]</span>)
                                            : (msg.content ? <MessageContent content={msg.content} /> : <span className="italic text-slate-300 text-xs">[empty]</span>)
                                        }
                                    </div>
                                    <MsgActions msg={msg} />
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        className="w-full pl-4 pr-12 py-3 bg-slate-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-[#137fec]/20 focus:bg-white transition-all"
                        placeholder="Type a message..."
                    />
                    <button className="absolute right-2 p-2 bg-[#137fec] text-white rounded-md hover:bg-blue-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
}
