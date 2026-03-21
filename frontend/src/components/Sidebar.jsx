import { Globe, MessageCircle, Send, Settings, ShieldCheck, LogOut, ShieldAlert, FileText, X } from 'lucide-react';

const NAV = [
    { key: 'all', label: 'All Users', icon: <Globe className="w-5 h-5" /> },
    { key: 'messenger', label: 'Messenger', icon: <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7.5v4H10v9.5h4v-9.5z" /></svg> },
    { key: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-5 h-5" /> },
    { key: 'telegram', label: 'Telegram', icon: <Send className="w-5 h-5" /> },
];

export default function Sidebar({ platform, setPlatform, sidebarOpen, setSidebarOpen }) {
    const handleNavClick = (key) => {
        setPlatform(key);
        setSidebarOpen(false);
    };

    return (
        <aside
            className={`
                fixed lg:static inset-y-0 left-0 z-40
                w-64 bg-white border-r border-slate-200 flex flex-col h-screen shrink-0
                transform transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                lg:translate-x-0
            `}
        >
            <div className="p-6 flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <ShieldAlert className="w-6 h-6 text-[#137fec]" />
                    Admin Panel
                </h1>
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <p className="px-6 pb-4 -mt-2 text-slate-500 text-xs font-medium">User Management System</p>

            <nav className="flex-1 px-4 overflow-y-auto">
                <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Platforms</p>
                <div className="space-y-1">
                    {NAV.map(({ key, label, icon }) => {
                        const active = platform === key;
                        return (
                            <button
                                key={key}
                                onClick={() => handleNavClick(key)}
                                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-left min-h-[44px]
                                    ${active
                                        ? 'bg-[#137fec]/10 border-l-4 border-[#137fec] text-[#137fec]'
                                        : 'hover:bg-slate-50 border-l-4 border-transparent text-slate-700 hover:text-slate-900'
                                    }`}
                            >
                                <span className={active ? 'text-[#137fec]' : 'text-slate-500'}>{icon}</span>
                                {label}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-6">
                    <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Data</p>
                    <div className="space-y-1">
                        <button
                            onClick={() => handleNavClick('posts')}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors text-left min-h-[44px]
                                ${platform === 'posts'
                                    ? 'bg-[#137fec]/10 border-l-4 border-[#137fec] text-[#137fec]'
                                    : 'hover:bg-slate-50 border-l-4 border-transparent text-slate-700 hover:text-slate-900'
                                }`}
                        >
                            <span className={platform === 'posts' ? 'text-[#137fec]' : 'text-slate-500'}>
                                <FileText className="w-5 h-5" />
                            </span>
                            Posts
                        </button>
                    </div>
                </div>

                <div className="mt-8">
                    <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Settings</p>
                    <div className="space-y-1">
                        <a href="#" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors min-h-[44px]">
                            <Settings className="w-5 h-5 text-slate-500" /> General
                        </a>
                        <a href="#" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors min-h-[44px]">
                            <ShieldCheck className="w-5 h-5 text-slate-500" /> API Keys
                        </a>
                    </div>
                </div>
            </nav>

            <div className="p-4 border-t border-slate-200">
                <button className="flex items-center gap-3 px-3 py-3 w-full rounded-lg hover:bg-red-50 text-slate-700 hover:text-red-600 transition-colors text-sm font-medium min-h-[44px]">
                    <LogOut className="w-5 h-5" /> Log Out
                </button>
            </div>
        </aside>
    );
}
