import PropTypes from 'prop-types';
import classNames from 'classnames';
import { ChevronUp, ChevronDown } from 'lucide-react';
import EmptyState from './EmptyState';
import Skeleton from './Skeleton';

const Table = ({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  sortBy,
  sortOrder = 'asc',
  onSort,
  keyField = '_id',
  className,
}) => {
  const handleSort = (column) => {
    if (!column.sortable || !onSort) return;
    const newOrder = sortBy === column.key && sortOrder === 'asc' ? 'desc' : 'asc';
    onSort(column.key, newOrder);
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-lg border border-secondary-200 dark:border-secondary-700">
        <div className="p-4 space-y-3">
          <Skeleton variant="rect" height={40} />
          <Skeleton count={5} variant="rect" height={48} />
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800">
        <EmptyState title="No data" description={emptyMessage} />
      </div>
    );
  }

  return (
    <div
      className={classNames(
        'overflow-hidden rounded-lg border border-secondary-200 dark:border-secondary-700 bg-white dark:bg-secondary-800',
        className
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary-50 dark:bg-secondary-900/50 border-b border-secondary-200 dark:border-secondary-700">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={classNames(
                    'px-4 py-3 text-left font-semibold text-secondary-700 dark:text-secondary-300 whitespace-nowrap',
                    column.sortable && 'cursor-pointer select-none hover:bg-secondary-100 dark:hover:bg-secondary-700',
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center'
                  )}
                  onClick={() => handleSort(column)}
                >
                  <div className={classNames(
                    'inline-flex items-center gap-1.5',
                    column.align === 'right' && 'flex-row-reverse'
                  )}>
                    {column.label}
                    {column.sortable && (
                      <span className="text-secondary-400">
                        {sortBy === column.key ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )
                        ) : (
                          <ChevronDown size={14} className="opacity-30" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-200 dark:divide-secondary-700">
            {data.map((row, index) => (
              <tr
                key={row[keyField] || index}
                onClick={() => onRowClick && onRowClick(row)}
                className={classNames(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-secondary-50 dark:hover:bg-secondary-700/50'
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={classNames(
                      'px-4 py-3 text-secondary-700 dark:text-secondary-300',
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center',
                      column.className
                    )}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      sortable: PropTypes.bool,
      align: PropTypes.oneOf(['left', 'center', 'right']),
      render: PropTypes.func,
      className: PropTypes.string,
    })
  ).isRequired,
  data: PropTypes.array,
  loading: PropTypes.bool,
  emptyMessage: PropTypes.string,
  onRowClick: PropTypes.func,
  sortBy: PropTypes.string,
  sortOrder: PropTypes.oneOf(['asc', 'desc']),
  onSort: PropTypes.func,
  keyField: PropTypes.string,
  className: PropTypes.string,
};

export default Table;