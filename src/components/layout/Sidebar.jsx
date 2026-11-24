import React from 'react';
import { ChevronLeft, ChevronRight, Shield, Activity, Hospital, LogOut, Database } from '../common/Icons.jsx';

/**
 * Collapsible sidebar tailored for role-specific portal navigation.
 */
export function Sidebar({
  portalName,
  portalType, // 'admin', 'phc', 'hospital'
  navItems = [],
  activeKey,
  onSelect,
  isCollapsed,
  onToggleCollapse
}) {
  const portalMeta = {
    admin: {
      badge: 'Admin Portal',
      icon: Shield,
      color: 'text-medgreen-900'
    },
    phc: {
      badge: 'PHC Portal',
      icon: Activity,
      color: 'text-medgreen-900'
    },
    hospital: {
      badge: 'District Hospital',
      icon: Hospital,
      color: 'text-medteal-700'
    }
  };

  const meta = portalMeta[portalType] || portalMeta.phc;
  const PortalIcon = meta.icon;

  return (
    <aside
      className={`bg-white border-r border-slate-200/90 flex flex-col transition-all duration-200 z-20 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand & Portal Type Bar */}
      <div className="h-16 px-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-medgreen-900 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
            ML
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight leading-tight">
                MediLink Offline
              </h2>
              <span className="inline-block text-[10px] font-semibold text-medgreen-800 bg-medgreen-50 px-1.5 py-0.2 rounded border border-medgreen-200/60 uppercase tracking-wide">
                {meta.badge}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-medgreen-50 text-medgreen-900 font-semibold border-r-2 border-medgreen-900'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {Icon && (
                <Icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    isActive ? 'text-medgreen-800' : 'text-slate-400'
                  }`}
                />
              )}
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {!isCollapsed && item.badge && (
                <span className="ml-auto px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 font-mono">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Collapse Toggle & Version */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <Database className="w-3.5 h-3.5 text-medgreen-700" />
            <span>IndexedDB v1.0</span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 mx-auto"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}

