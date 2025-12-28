'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Download, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Globe,
  Terminal,
  Menu,
  MessageCircle,
  Settings
} from 'lucide-react';
import { useTranslation } from './I18nProvider';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface SidebarProps {
  locale: string;
}

interface NavItem {
  href: string;
  icon: React.ElementType;
  labelKey: string;
}

const navItems: NavItem[] = [
  { href: '', icon: LayoutDashboard, labelKey: 'nav.overview' },
  { href: '/pull', icon: Download, labelKey: 'nav.pull' },
  { href: '/create', icon: Plus, labelKey: 'nav.create' },
  { href: '/chat', icon: MessageCircle, labelKey: 'nav.chat' },
  { href: '/settings', icon: Settings, labelKey: 'nav.settings' },
];

/**
 * Collapsible sidebar navigation with terminal aesthetic
 * Features animated transitions, glow effects, and responsive mobile drawer
 */
export function Sidebar({ locale }: SidebarProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const isActive = (path: string) => {
    const currentPath = pathname.replace(`/${locale}`, '') || '/';
    if (path === '') return currentPath === '/';
    return currentPath === path;
  };

  const switchLocale = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    const path = pathname.replace(`/${locale}`, '') || '/';
    window.location.href = `/${newLocale}${path}`;
  };

  const sidebarWidth = collapsed ? 'w-16' : 'w-64';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo Section */}
      <div className="p-4 border-b border-border/50">
        <Link href={`/${locale}`} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/30 glow-sm">
            <Terminal className="w-4 h-4 text-primary" />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="font-mono font-bold text-lg gradient-text whitespace-nowrap"
              >
                OLLAMA
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={`/${locale}${item.href}`}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                  active
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {/* Active indicator */}
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full"
                    style={{ boxShadow: '0 0 10px hsl(var(--primary))' }}
                  />
                )}
                
                <Icon className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  active && 'text-primary'
                )} />
                
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.15 }}
                      className="font-medium whitespace-nowrap"
                    >
                      {t(item.labelKey)}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Controls */}
      <div className="p-3 border-t border-border/50 space-y-2">
        {/* Theme Toggle */}
        <div className={cn(
          'flex items-center gap-2',
          collapsed ? 'justify-center' : 'px-2'
        )}>
          <ThemeToggle />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                Theme
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Language Toggle */}
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          onClick={switchLocale}
          className={cn(
            'w-full justify-start gap-2 hover:bg-primary/10 hover:text-primary',
            collapsed && 'justify-center'
          )}
        >
          <Globe className="h-4 w-4 flex-shrink-0" />
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                {locale === 'en' ? 'العربية' : 'English'}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>

        {/* Collapse Toggle (Desktop only) */}
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'default'}
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full justify-start gap-2 hover:bg-muted hidden md:flex',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-40 md:hidden bg-card/80 backdrop-blur-sm border border-border/50"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border/50 z-50 md:hidden terminal-card"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          'hidden md:flex flex-col h-screen bg-card/50 backdrop-blur-sm border-r border-border/50 fixed left-0 top-0 z-30',
          'terminal-card'
        )}
      >
        <SidebarContent />
      </motion.aside>

      {/* Spacer for desktop layout */}
      <motion.div
        initial={false}
        animate={{ width: collapsed ? 64 : 256 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="hidden md:block flex-shrink-0"
      />
    </>
  );
}

