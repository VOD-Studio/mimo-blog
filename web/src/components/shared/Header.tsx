"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import { LogOutIcon, UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { RippleButton } from "@/components/reactbits/RippleButton";
import { useAuthStore } from "@/features/auth/store";
import { usePublicSettings } from "@/features/settings/hooks/usePublicSettings";

import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { to: "/blog", label: "博客" },
  { to: "/projects", label: "项目" },
  { to: "/music", label: "音乐" },
  { to: "/about", label: "关于" },
];

/**
 * 用户头像（用户名缩写回退）
 */
function UserAvatar({ username, avatarUrl }: { username: string; avatarUrl?: string }) {
  const fallback = username?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-medium text-primary">
      {avatarUrl ? (
        <img src={avatarUrl} alt={username} className="h-full w-full object-cover" loading="lazy" />
      ) : (
        fallback
      )}
    </span>
  );
}

/**
 * 前台顶部导航
 */
export function Header() {
  const navigate = useNavigate();
  const { data: settings } = usePublicSettings();
  const siteName = settings?.site_name ?? "Mimo";

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [menuOpen]);

  const handleLogout = () => {
    clearAuth();
    setMenuOpen(false);
    navigate({ to: "/login", replace: true });
  };

  return (
    <header className="sticky top-0 z-50 px-4 py-3">
      <div className="container mx-auto">
        <div className="flex h-14 items-center justify-between rounded-2xl border border-border/60 bg-muted/80 px-4 shadow-sm backdrop-blur-xl dark:bg-background/80">
          <Link to="/" className="text-xl font-bold tracking-tight">
            {siteName}
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeProps={{ className: "bg-primary/10 text-primary" }}
                className="rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
            <div className="relative ml-2 flex items-center gap-1 border-l border-border/50 pl-2">
              <ThemeToggle />
              {user ? (
                <div ref={menuRef}>
                  <RippleButton
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 rounded-full px-2"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                  >
                    <UserAvatar username={user.username} avatarUrl={user.avatar_url} />
                    <span className="max-w-[80px] truncate text-xs font-medium">
                      {user.username}
                    </span>
                  </RippleButton>

                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 origin-top-right rounded-2xl border border-border/60 bg-muted/95 p-2 shadow-lg backdrop-blur-xl dark:bg-background/95">
                      <div className="px-3 py-2">
                        <p className="truncate text-sm font-medium">{user.username}</p>
                        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                      </div>
                      <div className="my-1 h-px bg-border/60" />
                      <RippleButton
                        asChild
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 rounded-xl"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Link to="/profile">
                          <UserIcon className="size-4" />
                          个人资料
                        </Link>
                      </RippleButton>
                      <RippleButton
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start gap-2 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={handleLogout}
                      >
                        <LogOutIcon className="size-4" />
                        退出登录
                      </RippleButton>
                    </div>
                  )}
                </div>
              ) : (
                <RippleButton asChild variant="ghost" size="sm" className="rounded-full">
                  <Link to="/login">登录</Link>
                </RippleButton>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
