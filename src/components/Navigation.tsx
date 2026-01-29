"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { href: "/", label: "Dashboard", icon: "◆" },
  { href: "/activity", label: "Activity", icon: "◈" },
  { href: "/approvals", label: "Approvals", icon: "◉" },
  { href: "/documents", label: "Documents", icon: "📄" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function Navigation() {
  const pathname = usePathname();
  const approvalStats = useQuery(api.approvals.getStats);
  const pendingCount = approvalStats?.pending ?? 0;

  return (
    <nav className="fixed left-0 top-0 h-full w-16 md:w-56 bg-surface border-r border-border flex flex-col z-40">
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <Image 
            src="/nordsym-logo.svg" 
            alt="NordSym" 
            width={32} 
            height={32}
            className="rounded-lg"
          />
          <span className="hidden md:block font-semibold text-lg font-headlines">
            Mission Control
          </span>
        </Link>
      </div>
      
      <div className="flex-1 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const showBadge = item.href === "/approvals" && pendingCount > 0;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-all relative
                ${isActive 
                  ? "bg-cyan/10 text-cyan border border-cyan/30" 
                  : "text-text-muted hover:text-text hover:bg-surface-2"
                }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="hidden md:block">{item.label}</span>
              {showBadge && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red text-white text-xs px-2 py-0.5 rounded-full">
                  {pendingCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-border space-y-3">
        <ThemeToggle />
        <div className="flex items-center gap-2 text-text-muted text-sm">
          <div className="w-2 h-2 rounded-full bg-green animate-pulse"></div>
          <span className="hidden md:block">Agent Online</span>
        </div>
      </div>
    </nav>
  );
}
