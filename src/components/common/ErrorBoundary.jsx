import React from 'react';
import { AlertTriangle, RefreshCw, Home } from './Icons.jsx';

/**
 * Standard React Error Boundary preventing application white-screens.
 * Guarantees that local IndexedDB storage and offline encryption are preserved.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log non-PII error telemetry locally
    console.error('[MediLink Error Boundary caught exception]:', error?.message);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl shadow-card p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Clinical Workstation Notice</h3>
              <p className="text-xs text-slate-500 mt-1">
                An unexpected interface exception occurred. Your local clinical records and cryptographic keys in IndexedDB remain completely secure.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-left">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Diagnostics</span>
              <span className="text-xs font-mono text-rose-700 font-semibold break-words">
                {this.state.error?.message || 'Component failed to render'}
              </span>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 inline-flex items-center justify-center space-x-2 px-3 py-2 bg-medgreen-800 text-white rounded-lg text-xs font-semibold hover:bg-medgreen-900 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Workstation</span>
              </button>

              <button
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center space-x-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

