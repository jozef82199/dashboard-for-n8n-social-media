import { useState, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import ChatPanel from './components/ChatPanel';
import PostsGrid from './components/PostsGrid';

export default function App() {
  const [platform, setPlatform] = useState('telegram');
  const [selectedUser, setSelectedUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

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
        <div className="w-10" />
      </header>

      {/* Sidebar */}
      <Sidebar
        platform={platform}
        setPlatform={handlePlatformChange}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main content area */}
      <main className="flex-1 flex flex-col pt-14 lg:pt-0 overflow-hidden">
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
