import React, { useState } from 'react';
import { Sidebar } from './Sidebar.jsx';
import { Header } from './Header.jsx';

/**
 * Standard Portal Layout Wrapper.
 * Provides cohesive sidebar, header, breadcrumbs, and responsive viewport.
 */
export function PortalLayout({
  portalType, // 'admin', 'phc', 'hospital'
  activePortal,
  onChangePortal,
  navItems = [],
  activeNav,
  onSelectNav,
  facilityName,
  facilityId,
  userName,
  userRole,
  pageTitle,
  pageDescription,
  headerAction,
  children
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-clinical-bg text-clinical-text font-sans antialiased">
      {/* Collapsible Role-Specific Sidebar */}
      <Sidebar
        portalName={pageTitle}
        portalType={portalType}
        navItems={navItems}
        activeKey={activeNav}
        onSelect={onSelectNav}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          activePortal={activePortal}
          onChangePortal={onChangePortal}
          facilityName={facilityName}
          facilityId={facilityId}
          userName={userName}
          userRole={userRole}
        />

        {/* Page Header Bar */}
        {(pageTitle || pageDescription || headerAction) && (
          <div className="bg-white border-b border-slate-200/90 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              {pageTitle && (
                <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  {pageTitle}
                </h1>
              )}
              {pageDescription && (
                <p className="text-xs text-slate-500 mt-0.5">{pageDescription}</p>
              )}
            </div>
            {headerAction && <div>{headerAction}</div>}
          </div>
        )}

        {/* Main Scrollable Content */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Clinical Air-Gap Compliance Footer */}
        <footer className="h-8 border-t border-slate-200 bg-white px-6 flex items-center justify-between text-[11px] text-slate-400 select-none">
          <span>MediLink Offline • Pure Client-Side Air-Gap Operation</span>
          <span>Security Standard: AES-256-GCM • RSA-OAEP • ECDSA P-256</span>
        </footer>
      </div>
    </div>
  );
}

