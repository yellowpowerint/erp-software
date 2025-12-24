'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { menuItems, type MenuItem } from '@/lib/config/menu';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
  onClose: () => void;
}

export default function Sidebar({ isOpen, isCollapsed, onToggleCollapsed, onClose }: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const canViewMenuItem = (item: MenuItem): boolean => {
    if (!user) return false;
    return item.roles.includes(user.role);
  };

  const filteredMenuItems = menuItems.filter(canViewMenuItem);

  const currentRoute = (() => {
    const search = searchParams?.toString();
    return search ? `${pathname}?${search}` : pathname;
  })();

  const matchesRoute = (path?: string) => {
    if (!path) return false;

    if (path.includes('?')) {
      return currentRoute === path;
    }

    return pathname === path || pathname.startsWith(path + '/');
  };

  const getBestMatchingChildPath = (item: MenuItem): string | null => {
    if (!item.children || item.children.length === 0) return null;

    const candidates = item.children
      .filter(canViewMenuItem)
      .map((child) => child.path)
      .filter((p): p is string => Boolean(p))
      .filter((p) => matchesRoute(p));

    if (candidates.length === 0) return null;

    return candidates.reduce((best, cur) => (cur.length > best.length ? cur : best), candidates[0]);
  };

  const isParentActive = (item: MenuItem) => {
    if (matchesRoute(item.path)) return true;
    return getBestMatchingChildPath(item) !== null;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-full bg-gray-900 text-white transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-20' : 'w-64',
          'overflow-y-auto'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden bg-white">
              <img src="/favicon.png" alt="Company" className="w-8 h-8 object-contain" />
            </div>
            {!isCollapsed && <span className="font-bold text-lg truncate">Yellow Power</span>}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="hidden lg:inline-flex text-gray-400 hover:text-white p-1 rounded"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
            <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className={cn('p-4 space-y-2', isCollapsed && 'px-2')}>
          {filteredMenuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.id) || isParentActive(item);
            const Icon = item.icon;
            const bestChildPath = hasChildren ? getBestMatchingChildPath(item) : null;
            const activeItem = matchesRoute(item.path);
            const activeParent = isParentActive(item);

            if (isCollapsed) {
              const href = bestChildPath || item.path || '#';
              return (
                <div key={item.id}>
                  <Link
                    href={href}
                    onClick={onClose}
                    title={item.label}
                    className={cn(
                      'flex items-center justify-center px-3 py-2 rounded-lg transition-colors',
                      matchesRoute(href)
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                </div>
              );
            }

            return (
              <div key={item.id}>
                {/* Parent Item */}
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors whitespace-nowrap',
                      activeParent
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                ) : (
                  <Link
                    href={item.path || '#'}
                    onClick={onClose}
                    className={cn(
                      'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors whitespace-nowrap',
                      activeItem
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-medium truncate">{item.label}</span>
                  </Link>
                )}

                {/* Children Items */}
                {hasChildren && isExpanded && (
                  <div className="ml-8 mt-2 space-y-1">
                    {item.children
                      ?.filter(canViewMenuItem)
                      .map((child) => {
                        const activeChild = Boolean(child.path && bestChildPath && child.path === bestChildPath);
                        return (
                          <Link
                            key={child.id}
                            href={child.path || '#'}
                            onClick={onClose}
                            className={cn(
                              'block px-3 py-2 rounded-lg text-xs transition-colors whitespace-nowrap truncate',
                              activeChild
                                ? 'bg-indigo-700 text-white'
                                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            )}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

      </aside>
    </>
  );
}
