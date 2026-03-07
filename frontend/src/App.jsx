import { useState, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import ChatPanel from './components/ChatPanel';

export default function App() {
  const [platform, setPlatform] = useState('telegram');
  const [selectedUser, setSelectedUser] = useState(null);

  const handlePlatformChange = useCallback((p) => {
    setPlatform(p);
    setSelectedUser(null);
  }, []);

  return (
    <>
      <Sidebar platform={platform} setPlatform={handlePlatformChange} />
      <MainContent platform={platform} selectedUser={selectedUser} onSelectUser={setSelectedUser} />
      <ChatPanel selectedUser={selectedUser} />
    </>
  );
}
