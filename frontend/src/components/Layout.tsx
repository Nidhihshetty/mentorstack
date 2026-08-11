"use client";

import { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  sidebarProps?: any;
  navbarProps?: any;
}

const Layout = ({
  children,
  showSidebar = true,
  sidebarProps = {},
  navbarProps = {},
}: LayoutProps) => {
  return (
    <div className="flex h-screen bg-[var(--color-neutral-dark)] text-[var(--color-tertiary)]">
      {/* Sidebar - Always visible */}
      {showSidebar && (
        <div className="lg:block hidden">
          <Sidebar
            {...sidebarProps}
          />
        </div>
      )}

      {/* Main Content - Takes full width when sidebar is hidden */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Navbar */}
        <Navbar {...navbarProps} />

        {/* Page Content */}
        <div className="flex-1 overflow-auto">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
