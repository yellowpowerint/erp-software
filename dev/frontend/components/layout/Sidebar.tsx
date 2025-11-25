'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { menuItems, type MenuItem } from '@/lib/config/menu';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
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

  const isActive = (path?: string) => {
    if (!path) return false;
    return pathname === path || pathname.startsWith(path + '/');
  };

  const isParentActive = (item: MenuItem) => {
    if (isActive(item.path)) return true;
    return item.children?.some((child) => isActive(child.path)) || false;
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
          'w-64 overflow-y-auto'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">ERP</span>
            </div>
            <span className="font-bold text-lg">Mining ERP</span>
          </div>
          <button onClick={onClose} className="lg:hidden text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Items */}
        <nav className="p-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.includes(item.id) || isParentActive(item);
            const Icon = item.icon;
            const activeItem = isActive(item.path);
            const activeParent = isParentActive(item);

            return (
              <div key={item.id}>
                {/* Parent Item */}
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors',
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
                      'flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
                      activeItem
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                )}

                {/* Children Items */}
                {hasChildren && isExpanded && (
                  <div className="ml-8 mt-2 space-y-1">
                    {item.children
                      ?.filter(canViewMenuItem)
                      .map((child) => {
                        const activeChild = isActive(child.path);
                        return (
                          <Link
                            key={child.id}
                            href={child.path || '#'}
                            onClick={onClose}
                            className={cn(
                              'block px-3 py-2 rounded-lg text-sm transition-colors',
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

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-900">
          <div className="text-xs text-gray-500 text-center">
            © 2025 Mining ERP v1.0
          </div>
        </div>
      </aside>
    </>
  );
}
