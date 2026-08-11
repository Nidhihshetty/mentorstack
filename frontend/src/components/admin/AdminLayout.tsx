"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { adminAPI } from "@/lib/admin-api";
import {
  Shield,
  Users,
  BookImage,
  HelpCircle,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  Hash,
  Handshake,
  MessagesSquare,
  Award,
  TrendingUp
} from "lucide-react";

interface AdminLayoutProps {
  readonly children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      if (!adminAPI.isAuthenticated()) {
        router.push('/admin/login');
        return;
      }

      const { admin } = await adminAPI.getCurrentAdmin();
      setAdminName(admin.name);
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/admin/login');
    }
  };

  const handleLogout = async () => {
    await adminAPI.logout();
    router.push('/admin/2263746');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: BarChart3 },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Question & Answers', href: '/admin/content', icon: HelpCircle },
    { name: 'Mentorship', href: '/admin/mentorship', icon: Handshake },
    { name: 'Communities', href: '/admin/communities', icon: MessagesSquare },
    { name: 'Articles', href: '/admin/article', icon: BookImage },
    { name: 'Tags', href: '/admin/tags', icon: Hash },
    { name: 'Badges', href: '/admin/badges', icon: Award },
    { name: 'Reputation', href: '/admin/reputation', icon: TrendingUp },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (href: string) => {
    // Mark exact match or nested route under the section as active.
    // Special case: treat "/admin" as dashboard too, if that's the landing page.
    if (href === '/admin/dashboard' && (pathname === '/admin' || pathname === '/admin/')) {
      return true;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSidebarOpen(false);
          }}
          aria-label="Close sidebar overlay"
        />
      )}

      {/* Sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r pt-5 pb-4 overflow-y-auto shadow-lg">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4">
            <Shield className="w-8 h-8 text-teal-500" />
            <span className="ml-2 text-xl font-bold text-gray-900">MentorStack</span>
            <span className="ml-2 text-sm font-medium text-gray-500">Admin</span>
          </div>

          {/* Admin Info */}
          <div className="mt-6 px-4">
            <div className="bg-teal-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {adminName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{adminName}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-8 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.href)}
                  className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors ${active
                      ? 'bg-teal-100 text-teal-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                >
                  <Icon
                    className={`mr-3 flex-shrink-0 h-5 w-5 ${active ? 'text-teal-500' : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                  />
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="px-2 pb-4">
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 hover:text-red-900 transition-colors"
            >
              <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-red-400 group-hover:text-red-500" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        <div className="flex flex-col h-full">
          {/* Mobile header */}
          <div className="flex items-center justify-between h-16 px-4 border-b">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-teal-500" />
              <span className="ml-2 text-xl font-bold text-gray-900">Admin</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile navigation - same as desktop */}
          <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
            {/* Admin Info */}
            <div className="px-4 mb-6">
              <div className="bg-teal-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {adminName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{adminName}</p>
                    <p className="text-xs text-gray-500">Administrator</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <button
                    key={item.name}
                    onClick={() => {
                      router.push(item.href);
                      setSidebarOpen(false);
                    }}
                    className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors ${active
                        ? 'bg-teal-100 text-teal-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                  >
                    <Icon
                      className={`mr-3 flex-shrink-0 h-5 w-5 ${active ? 'text-teal-500' : 'text-gray-400 group-hover:text-gray-500'
                        }`}
                    />
                    {item.name}
                  </button>
                );
              })}
            </nav>

            {/* Logout Button */}
            <div className="px-2 pb-4">
              <button
                onClick={handleLogout}
                className="group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50 hover:text-red-900 transition-colors"
              >
                <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-red-400 group-hover:text-red-500" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar for mobile */}
        <div className="sticky top-0 z-10 lg:hidden bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center">
              <Shield className="w-6 h-6 text-teal-500" />
              <span className="ml-2 text-lg font-semibold text-gray-900">Admin Panel</span>
            </div>
            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSidebarOpen(false);
          }}
          aria-label="Close sidebar overlay"
        />
      )}
    </div>
  );
}
