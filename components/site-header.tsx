"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon } from "lucide-react";
import { siteConfig } from "@/config/site";
import AuthStatus from "@/components/auth-status";

export default function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme === 'dark') {
      setTheme('dark');
    } else {
      setTheme('light');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/70 backdrop-blur-md border-b border-border-base transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex h-12 items-center justify-between">
          <Link
            href="/"
            className="text-sm font-semibold text-foreground/90 hover:text-foreground transition-colors tracking-tight"
            onClick={() => setIsOpen(false)}
          >
            InfCraft
          </Link>

          {/* 桌面端导航 */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-7">
              {siteConfig.navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-xs transition-colors
                    ${pathname === link.href
                      ? "text-foreground font-medium"
                      : "text-text-muted hover:text-foreground"
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="h-4 w-px bg-border-base" />

            <AuthStatus />

            <button
              onClick={toggleTheme}
              className="p-1 rounded-full text-text-muted hover:text-foreground hover:bg-card-hover transition-all cursor-pointer"
              aria-label="切换主题"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4.5 w-4.5" />
              ) : (
                <Moon className="h-4.5 w-4.5" />
              )}
            </button>
          </div>

          {/* 移动端控制区 */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-1 rounded-full text-text-muted hover:text-foreground hover:bg-card-hover transition-all cursor-pointer mr-1"
              aria-label="切换主题"
            >
              {mounted && theme === "dark" ? (
                <Sun className="h-4.5 w-4.5" />
              ) : (
                <Moon className="h-4.5 w-4.5" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 text-text-muted hover:text-foreground transition-colors cursor-pointer"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-border-base bg-background/95 backdrop-blur-xl animate-slide-down">
          <div className="px-6 py-4 space-y-1">
            {siteConfig.navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={`block py-2 text-sm transition-colors
                  ${pathname === link.href
                    ? "text-foreground font-medium"
                    : "text-text-muted hover:text-foreground"
                  }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-border-base">
            <AuthStatus />
          </div>
        </div>
      )}
    </header>
  );
}
