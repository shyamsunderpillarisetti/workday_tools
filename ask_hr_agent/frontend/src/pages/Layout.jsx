
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  MessageSquare, 
  LayoutDashboard, 
  LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { User } from '@/api/entities';
import { Toaster } from 'sonner';

const navigation = [
  { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
  { name: 'AskHR', href: 'AskHR', icon: MessageSquare },
];

export default function Layout({ children, currentPageName }) {
  const isFullScreen = currentPageName === 'AskHR';

  const handleLogout = async () => {
    await User.logout();
  };

  // Full screen layout for AskHR chatbot
  if (isFullScreen) {
    return (
      <div className="h-screen flex flex-col">
        <Toaster position="top-right" richColors />
        {children}
      </div>
    );
  }

  // Standard layout with navigation
  return (
    <div className="min-h-screen bg-slate-50">
      <Toaster position="top-right" richColors />
      
      {/* Top Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">M</span>
              </div>
              <div>
                <span className="font-semibold text-slate-800 text-lg">Michaels</span>
                <span className="text-red-600 font-medium ml-1">AskHR</span>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden sm:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.href;
                return (
                  <Link
                    key={item.name}
                    to={createPageUrl(item.href)}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-red-50 text-red-700" 
                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2">
              <Link
                to={createPageUrl('AskHR')}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg text-sm font-medium shadow-md shadow-red-200/50 hover:from-red-600 hover:to-red-700 transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                Ask HR
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40">
        <div className="flex items-center justify-around py-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.href;
            return (
              <Link
                key={item.name}
                to={createPageUrl(item.href)}
                className={cn(
                  "flex flex-col items-center gap-1 px-4 py-2 text-xs font-medium transition-colors",
                  isActive ? "text-red-600" : "text-slate-500"
                )}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <main className="pb-20 sm:pb-0">
        {children}
      </main>
    </div>
  );
}
