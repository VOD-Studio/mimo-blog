"use client";

import { Link, useNavigate } from "@tanstack/react-router";
import { LogOutIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
 * 前台顶部导航
 */
export function Header() {
  const navigate = useNavigate();
  const { data: settings } = usePublicSettings();
  const siteName = settings?.site_name ?? "Mimo";

  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
    navigate({ to: "/login" });
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
            <div className="ml-2 flex items-center gap-2 border-l border-border/50 pl-2">
              <ThemeToggle />
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger className="relative flex h-8 w-8 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                    <Avatar size="sm">
                      <AvatarImage src={user.avatar_url} alt={user.username} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                        {user.username?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.username}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={handleLogout}>
                      <LogOutIcon className="mr-2 size-4" />
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  to="/login"
                  className="rounded-xl px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
                >
                  登录
                </Link>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
