import React from 'react';
import { AlertCircle, AlertTriangle, Inbox, RefreshCw, Wifi, WifiOff } from './Icons.jsx';

export function LoadingState({ message = 'Loading records...' }) {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center">
      <RefreshCw className="w-8 h-8 text-medgreen-700 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-700">{message}</p>
      <p className="text-xs text-slate-400 mt-1">Retrieving data from local client storage</p>
    </div>
  );
}

export function EmptyState({
  title = 'No records available',
  description = 'No entries were found in the current offline view.',
  action,
  icon: Icon = Inbox
}) {
  return (
    <div className="py-12 px-6 flex flex-col items-center justify-center text-center bg-white border border-dashed border-slate-200 rounded-lg">
      <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200/80 flex items-center justify-center text-slate-400 mb-3">
        <Icon className="w-6 h-6 stroke-[1.5]" />
      </div>
      <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      <p className="text-xs text-slate-500 max-w-sm mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Application Notice',
  message = 'An unexpected condition occurred while accessing this view.',
  retryAction
}) {
  return (
    <div className="p-6 bg-red-50/60 border border-red-200 rounded-lg flex items-start space-x-3">
      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-red-900">{title}</h4>
        <p className="text-xs text-red-700 mt-1">{message}</p>
        {retryAction && (
          <button
            onClick={retryAction}
            className="mt-3 text-xs font-medium text-red-800 underline hover:text-red-950"
          >
            Retry operation
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Displays live online/offline network indicator.
 */
export function OfflineBadge() {
  const [isOffline, setIsOffline] = React.useState(!navigator.onLine);

  React.useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700">
      {isOffline ? (
        <>
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <WifiOff className="w-3.5 h-3.5 text-amber-600" />
          <span className="text-amber-800 font-medium">Offline Mode</span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-emerald-800 font-medium">Online (Sync Active)</span>
        </>
      )}
    </div>
  );
}

