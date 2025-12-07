import { ChevronLeft, ChevronRight } from 'lucide-react';
import Spinner from './Spinner';
import clsx from 'clsx';

export default function DataTable({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  rowActions,
  pagination,
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <p className="text-gray-500 text-lg font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={clsx(
                  'px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider',
                  column.width && `w-${column.width}`
                )}
              >
                {column.header}
              </th>
            ))}
            {rowActions && <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">Actions</th>}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr
              key={item.id || index}
              onClick={() => onRowClick && onRowClick(item)}
              className={clsx(
                onRowClick && 'cursor-pointer hover:bg-gray-50 transition-colors duration-200',
                'animate-fade-in'
              )}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {column.render
                    ? column.render(item)
                    : typeof column.key === 'string'
                    ? item[column.key] || '-'
                    : '-'}
                </td>
              ))}
              {rowActions && (
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {rowActions(item)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {pagination && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              disabled={pagination.page * pagination.pageSize >= pagination.total}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.page - 1) * pagination.pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)}
                </span>{' '}
                of <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  onClick={() => pagination.onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => pagination.onPageChange(pagination.page + 1)}
                  disabled={pagination.page * pagination.pageSize >= pagination.total}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

