'use client';

import { Bell, Search, Menu, Wifi, WifiOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useSocket } from '@/contexts/SocketContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function Header() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { isConnected } = useSocket();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white border-b border-gray-200">
      <button
        type="button"
        className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>
      
      <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex flex-1">
          <form className="flex w-full md:ml-0" action="#" method="GET">
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <div className="relative w-full text-gray-400 focus-within:text-gray-600">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
                <Search className="h-5 w-5" />
              </div>
              <input
                id="search-field"
                name="search-field"
                className="block h-full w-full border-transparent py-2 pl-8 pr-3 text-gray-900 placeholder-gray-500 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
                placeholder="Search..."
                type="search"
              />
            </div>
          </form>
        </div>
        
        <div className="ml-4 flex items-center gap-4">
          {/* WebSocket Connection Indicator */}
          <div className="flex items-center gap-2" title={isConnected ? 'Connected' : 'Disconnected'}>
            {isConnected ? (
              <Wifi className="h-5 w-5 text-green-500" />
            ) : (
              <WifiOff className="h-5 w-5 text-red-500" />
            )}
          </div>

          <button
            type="button"
            onClick={() => router.push('/dashboard/notifications')}
            className="rounded-full p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <Bell className="h-6 w-6" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2"
            >
              <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white font-medium">
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg py-1">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-black">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
