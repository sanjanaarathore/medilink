import React from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from './Icons.jsx';

/**
 * Reusable clinical content card with optional header actions.
 */
export function Card({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = '',
  contentClassName = '',
  footer
}) {
  return (
    <div className={`bg-white border border-slate-200/90 rounded-lg shadow-card overflow-hidden ${className}`}>
      {(title || subtitle || Icon || action) && (
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="w-8 h-8 rounded-md bg-medgreen-50 text-medgreen-800 flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
            )}
            <div>
              {title && <h3 className="text-sm font-semibold text-slate-900 tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`p-5 ${contentClassName}`}>{children}</div>
      {footer && <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/70">{footer}</div>}
    </div>
  );
}

/**
 * Accessible modal dialog with backdrop blur.
 */
export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
  footer
}) {
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full ${maxWidth} bg-white rounded-lg border border-slate-200 shadow-modal overflow-hidden transform transition-all`}>
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-md p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6">{children}</div>
          {footer && (
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Clinical data table with search, sorting, and pagination.
 */
export function DataTable({
  columns = [],
  data = [],
  keyField = 'id',
  searchPlaceholder = 'Search records...',
  searchField = '',
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your criteria.',
  onRowClick,
  actions
}) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 10;

  const filteredData = React.useMemo(() => {
    if (!searchTerm.trim()) return data;
    return data.filter((item) => {
      if (searchField && item[searchField]) {
        return String(item[searchField]).toLowerCase().includes(searchTerm.toLowerCase());
      }
      return Object.values(item).some((val) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [data, searchTerm, searchField]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-lg shadow-card overflow-hidden">
      {/* Top Search & Actions Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-medgreen-700 focus:border-medgreen-700"
          />
        </div>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>

      {/* Table Surface */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className={`data-table-th ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedData.length > 0 ? (
              paginatedData.map((row, rIdx) => (
                <tr
                  key={row[keyField] || rIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-slate-50/80 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`data-table-td ${col.cellClassName || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Inbox className="w-10 h-10 stroke-[1.5] mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">{emptyTitle}</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
        <span>
          Showing {filteredData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
          {Math.min(currentPage * pageSize, filteredData.length)} of {filteredData.length} records
        </span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium text-slate-700">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

