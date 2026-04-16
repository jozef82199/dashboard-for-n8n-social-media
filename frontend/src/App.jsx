import { useState, useCallback, useEffect } from 'react';
import { Menu, X, Zap, MessageSquare } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import ChatPanel from './components/ChatPanel';
import PostsGrid from './components/PostsGrid';
import { getRedisConfig, setRedisConfig } from './api/client';

function RedisToggle({ label, icon, value, onChange }) {
    const Icon = icon;
    return (
        <button
            onClick={onChange}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                value
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'bg-slate-100 border-slate-300 text-slate-500'
            }`}
        >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
            <span className={`inline-block w-2 h-2 rounded-full ${value ? 'bg-emerald-500' : 'bg-slate-400'}`} />
        </button>
    );
}

export default function App() {
    const [platform, setPlatform] = useState('telegram');
    const [selectedUser, setSelectedUser] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [chatOpen, setChatOpen] = useState(false);
    const [redisConfig, setRedisConfigState] = useState({
        workflowRunning: false,
        default_user_bot_respond: false,
    });

    useEffect(() => {
        getRedisConfig()
            .then((config) => setRedisConfigState(config))
            .catch((err) => console.error('Failed to load Redis config:', err));
    }, []);

    const handleRedisToggle = useCallback(async (key) => {
        const newVal = !redisConfig[key];
        setRedisConfigState((prev) => ({ ...prev, [key]: newVal }));
        try {
            await setRedisConfig(key, newVal);
            const actual = await getRedisConfig();
            setRedisConfigState(actual);
        } catch (err) {
            console.error('Failed to update Redis config:', err);
            const actual = await getRedisConfig().catch(() => null);
            if (actual) {
                setRedisConfigState(actual);
            } else {
                setRedisConfigState((prev) => ({ ...prev, [key]: !newVal }));
            }
            alert('Failed to update Redis config. Check backend and Redis connection.');
        }
    }, [redisConfig]);

  const handlePlatformChange = useCallback((p) => {
    setPlatform(p);
    setSelectedUser(null);
    setSidebarOpen(false);
  }, []);

  const handleSelectUser = useCallback((user) => {
    setSelectedUser(user);
    setChatOpen(true);
  }, []);

  const handleCloseChat = useCallback(() => {
    setChatOpen(false);
    setSelectedUser(null);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* Mobile backdrop for sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile backdrop for chat */}
      {chatOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={handleCloseChat}
        />
      )}

      {/* Mobile header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-20 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-sm font-semibold text-slate-900">Admin Panel</h1>
        <div className="flex items-center gap-2">
          <RedisToggle label="Workflow" icon={Zap} value={redisConfig.workflowRunning} onChange={() => handleRedisToggle('workflowRunning')} />
          <RedisToggle label="Bot Respond" icon={MessageSquare} value={redisConfig.default_user_bot_respond} onChange={() => handleRedisToggle('default_user_bot_respond')} />
        </div>
      </header>

      {/* Desktop Redis toggle bar */}
      <div className="hidden lg:flex fixed top-0 right-0 left-64 h-12 bg-white border-b border-slate-200 items-center justify-end px-6 z-10 gap-3">
        <RedisToggle label="Workflow Running" icon={Zap} value={redisConfig.workflowRunning} onChange={() => handleRedisToggle('workflowRunning')} />
        <RedisToggle label="Default Bot Respond" icon={MessageSquare} value={redisConfig.default_user_bot_respond} onChange={() => handleRedisToggle('default_user_bot_respond')} />
      </div>

      {/* Sidebar */}
      <Sidebar
        platform={platform}
        setPlatform={handlePlatformChange}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content area */}
      <main className="flex-1 flex flex-col pt-14 lg:pt-12 overflow-hidden">
        {platform === 'posts' ? (
          <PostsGrid />
        ) : (
          <MainContent
            platform={platform}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
          />
        )}
      </main>

      {/* Chat panel */}
      <ChatPanel
        selectedUser={selectedUser}
        chatOpen={chatOpen}
        onCloseChat={handleCloseChat}
      />
    </div>
  );
}
