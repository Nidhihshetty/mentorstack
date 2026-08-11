"use client";

import { Home, Bell, UserCircle, Menu, Search, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { authAPI } from "@/lib/auth-api";
import AvatarDisplay from "./AvatarDisplay";

interface NavbarProps {
  onMenuClick?: () => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  className?: string;
}

const Navbar = ({
  onMenuClick,
  searchPlaceholder = "Search for questions...",
  showSearch = true,
  className = "",
}: NavbarProps) => {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; avatarUrl?: string | null } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Load current user info
  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await authAPI.getCurrentUser();
        setCurrentUser({
          name: user.user.name,
          avatarUrl: user.user.avatarUrl || null
        });
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    };
    loadUser();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      // Still redirect even if logout API fails
      router.push('/');
    }
  };

  return (
    <header
      className={`flex items-center justify-between px-6 py-4 bg-[var(--color-neutral)] shadow-sm border-b border-[var(--color-neutral-dark)] ${className}`}
    >
      {/* Menu button on the left */}
      <div className="flex items-center">
        {onMenuClick && (
          <Menu 
            className="w-6 h-6 text-[var(--color-tertiary-light)] cursor-pointer hover:text-[var(--color-primary)] transition mr-4" 
            onClick={onMenuClick}
          />
        )}
      </div>

      {/* Navigation icons on the right */}
      <div className="flex items-center gap-5">
        <button
          className="text-sm font-medium text-[var(--color-tertiary-light)] hover:text-[var(--color-primary)] transition"
          onClick={() => router.push('/chatbot')}
        >
          AI Chat
        </button>
        <Home 
          className="w-6 h-6 text-[var(--color-tertiary-light)] cursor-pointer hover:text-[var(--color-primary)] transition"
          onClick={() => router.push('/home')}
        />
        {/*<Bell className="w-6 h-6 text-[var(--color-tertiary-light)] cursor-pointer hover:text-[var(--color-primary)] transition" />*/}
        
        {/* User Menu Dropdown */}
        <div className="relative" ref={menuRef}>
          <div
            className="cursor-pointer"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            {currentUser?.avatarUrl ? (
              <AvatarDisplay
                avatarUrl={currentUser.avatarUrl}
                name={currentUser.name}
                size="sm"
              />
            ) : (
              <UserCircle className="w-7 h-7 text-[var(--color-tertiary-light)] hover:text-[var(--color-primary)] transition" />
            )}
          </div>
          
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  router.push('/profile');
                }}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
