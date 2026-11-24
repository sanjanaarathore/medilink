import React, { useState } from 'react';
import { Shield, Lock, ArrowRight, AlertCircle } from '../../components/common/Icons.jsx';
import { Button } from '../../components/common/Button.jsx';
import { login } from '../../services/authService.js';

export default function AdminLogin({ onLoginSuccess }) {
  const [pin, setPin] = useState('1234');
  const [username, setUsername] = useState('admin.patel');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!pin || pin.length < 4) {
      setError('Please enter a valid 4-6 digit authorization PIN.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(username, pin);
      setLoading(false);
      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        setError(res.error || 'Authentication failed.');
      }
    } catch (err) {
      setLoading(false);
      setError(err.message || 'An error occurred during authentication.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-xl shadow-card overflow-hidden">
        {/* Header */}
        <div className="bg-medgreen-900 px-6 py-8 text-center text-white">
          <div className="w-12 h-12 mx-auto rounded-xl bg-medgreen-800 border border-medgreen-700/60 flex items-center justify-center mb-3 shadow-sm">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight">Admin Portal Access</h2>
          <p className="text-xs text-medgreen-200 mt-1">
            Facility Registry, User RBAC & Trust Directory Management
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="input-label">Administrator Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-field"
              placeholder="e.g. admin.patel"
              required
            />
          </div>

          <div>
            <label className="input-label">Authorization PIN</label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="input-field font-mono tracking-widest text-base"
                placeholder="••••"
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Verified against salted hash in IndexedDB via PBKDF2/SHA-256. (Default: <code className="font-mono text-medgreen-800 bg-slate-100 px-1 py-0.5 rounded">1234</code>)
            </p>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full"
              icon={ArrowRight}
              iconPosition="right"
            >
              Authenticate & Unlock Admin Portal
            </Button>
          </div>
        </form>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
          Client-Side Credential Verification • Zero Cloud Round-Trip
        </div>
      </div>
    </div>
  );
}
