import React from 'react';
import { OfflineBadge } from '../common/StateViews.jsx';
import { Shield, Building2, User, RefreshCw, ChevronDown } from '../common/Icons.jsx';

/**
 * Top application bar with facility context, offline status, and quick portal switcher.
 */
export function Header({
  activePortal,
  onChangePortal,
  facilityName = 'Dhar Primary Health Centre',
  facilityId = 'PHC-DHAR-04',
  userName = 'Dr. Rajesh Sharma',
  userRole = 'PHC Medical Officer'
}) {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const portals = [
    { key: 'admin', label: '1. Admin Portal', desc: 'Facilities, Users & Security' },
    { key: 'phc', label: '2. PHC Portal', desc: 'Patient Intake & Referral QR' },
    { key: 'hospital', label: '3. District Hospital Portal', desc: 'QR Ingestion & Triage' }
  ];

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-6 flex items-center justify-between z-10">
      {/* Facility & Node Identifier */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
          <Building2 className="w-4 h-4 text-medgreen-800" />
          <span className="font-semibold text-slate-800">{facilityName}</span>
          <span className="text-slate-400 font-mono">({facilityId})</span>
        </div>
      </div>

      {/* Right Controls: Portal Switcher, Offline Indicator, User Profile */}
      <div className="flex items-center space-x-4">
        {/* Live Network & Offline State Badge */}
        <OfflineBadge />

        {/* Portal Switchboard Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 focus:outline-none"
          >
            <span className="font-semibold text-medgreen-900 uppercase tracking-wide">
              Switch Portal:
            </span>
            <span className="capitalize">{activePortal}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 z-30">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Authorized Portals
              </div>
              {portals.map((p) => (
                <button
                  key={p.key}
                  onClick={() => {
                    onChangePortal(p.key);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex flex-col transition-colors ${
                    activePortal === p.key
                      ? 'bg-medgreen-50 text-medgreen-900 font-semibold'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{p.label}</span>
                  <span className="text-[10px] text-slate-400 font-normal">{p.desc}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Identity Avatar & Role */}
        <div className="flex items-center space-x-2.5 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-medgreen-900 text-white flex items-center justify-center text-xs font-semibold">
            {userName.charAt(0)}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-semibold text-slate-900 leading-tight">{userName}</div>
            <div className="text-[10px] text-slate-400 font-medium">{userRole}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

