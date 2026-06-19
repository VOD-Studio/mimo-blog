import { Link } from "@tanstack/react-router";

import { ThemeToggle } from "./ThemeToggle";

/**
 * 前台顶部导航
 */
export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="text-xl font-bold">
          Mimo
        </Link>
        <nav className="flex items-center gap-6">
          <Link to="/blog">博客</Link>
          <Link to="/projects">项目</Link>
          <Link to="/music">音乐</Link>
          <Link to="/about">关于</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
