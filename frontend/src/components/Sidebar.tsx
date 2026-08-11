"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { authAPI } from "@/lib/auth-api";

interface MenuItem {
  name: string;
  href: string;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  menuItems?: MenuItem[];
}

const Sidebar = ({
  isOpen = true,
  onClose,
  className = "",
  menuItems,
}: SidebarProps) => {
  const [userRole, setUserRole] = useState<'mentor' | 'mentee' | 'admin' | null>(null);
  const [dynamicMenuItems, setDynamicMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    async function fetchUserRole() {
      if (!authAPI.isAuthenticated()) {
        setUserRole(null);
        return;
      }

      try {
        const response = await authAPI.getCurrentUser();
        setUserRole(response.user.role);
      } catch (error) {
        setUserRole(null);
        const message = error instanceof Error ? error.message : '';
        if (message && (message.includes('Token is not valid') || message.includes('No token') || message.includes('Not authenticated'))) {
          return;
        }
        console.error('Failed to fetch user role:', error);
      }
    }
    fetchUserRole();
  }, []);

  useEffect(() => {
    // Build menu items based on role
    const baseMenuItems: MenuItem[] = [
      { name: "Home", href: "/home" },
      { name: "Questions", href: "/questions" },
    ];

    // Role-specific menu items
    if (userRole === 'mentor') {
      baseMenuItems.push({ name: "Requests", href: "/mentee-request" });
    } else if (userRole === 'mentee') {
      baseMenuItems.push({ name: "Mentors", href: "/mentor-list" });
    }

    // Common menu items for all roles
    baseMenuItems.push(
      { name: "Chats", href: "/chats" },
      { name: "Community", href: "/community" },
      { name: "Profile", href: "/profile" },
      { name: "Tags", href: "/tags" },
      { name: "Articles", href: "/articles" },
      { name: "Bookmarks", href: "/bookmarks" },
      { name: "Contact", href: "/contact" }
    );

    setDynamicMenuItems(baseMenuItems);
  }, [userRole]);

  // Use provided menuItems or dynamically generated ones
  const finalMenuItems = menuItems || dynamicMenuItems;
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        ${isOpen ? "translate-x-0" : "-translate-x-full"} 
        fixed lg:static inset-y-0 left-0 z-50 w-64 h-full
        bg-[var(--color-secondary)] text-[var(--color-neutral)] 
        p-6 flex flex-col gap-6 shadow-lg 
        transition-transform duration-300 ease-in-out
        ${className}
      `}
      >
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold tracking-wide">
            Mentor
            <span className="text-[var(--color-surface-dark)]">Stack</span>
          </h1>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="lg:hidden text-[var(--color-neutral)] hover:text-[var(--color-surface-dark)]"
          >
            ✕
          </button>
        </div>

        <nav className="flex flex-col gap-3">
          {finalMenuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="px-3 py-2 rounded-lg transition-colors duration-200 hover:bg-[var(--color-secondary-light)]"
              onClick={onClose} // Close sidebar when clicking a link on mobile
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
