import React from 'react';

/**
 * Polished clinical action button.
 */
export function Button({
  children,
  variant = 'primary', // 'primary', 'secondary', 'outline', 'emergency', 'ghost'
  size = 'md',        // 'sm', 'md', 'lg'
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const baseClasses = "inline-flex items-center justify-center font-medium transition-all rounded-md focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed select-none";

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-3.5 py-2 text-sm gap-2",
    lg: "px-4 py-2.5 text-base gap-2.5"
  };

  const variantClasses = {
    primary: "bg-medgreen-900 text-white hover:bg-medgreen-800 active:bg-medgreen-950 focus:ring-medgreen-700 shadow-sm",
    secondary: "bg-medteal-700 text-white hover:bg-medteal-600 active:bg-medteal-800 focus:ring-medteal-500 shadow-sm",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 active:bg-slate-100 focus:ring-medgreen-700 shadow-sm",
    emergency: "bg-emergency-600 text-white hover:bg-emergency-700 active:bg-emergency-800 focus:ring-emergency-500 shadow-sm",
    ghost: "text-slate-600 hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-400"
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
      ) : (
        Icon && iconPosition === 'left' && <Icon className={size === 'sm' ? "w-3.5 h-3.5" : "w-4 h-4"} />
      )}
      <span>{children}</span>
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={size === 'sm' ? "w-3.5 h-3.5" : "w-4 h-4"} />
      )}
    </button>
  );
}

/**
 * Clinical priority and status pill badge.
 */
export function Badge({
  children,
  variant = 'default', // 'emergency', 'urgent', 'routine', 'success', 'warning', 'info', 'neutral'
  size = 'md',
  className = '',
  dot = false
}) {
  const variantStyles = {
    emergency: "bg-red-50 text-red-700 border border-red-200/80 font-semibold",
    urgent: "bg-amber-50 text-amber-700 border border-amber-200/80 font-semibold",
    routine: "bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-medium",
    success: "bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium",
    warning: "bg-amber-50 text-amber-700 border border-amber-200 font-medium",
    info: "bg-sky-50 text-sky-700 border border-sky-200 font-medium",
    neutral: "bg-slate-100 text-slate-700 border border-slate-200 font-medium"
  };

  const dotColors = {
    emergency: "bg-red-500",
    urgent: "bg-amber-500",
    routine: "bg-emerald-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    info: "bg-sky-500",
    neutral: "bg-slate-400"
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-0.5 text-xs",
    lg: "px-3 py-1 text-sm"
  };

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.neutral} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || 'bg-slate-400'}`} />}
      {children}
    </span>
  );
}

