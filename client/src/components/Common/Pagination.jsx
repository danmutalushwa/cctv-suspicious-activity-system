import PropTypes from 'prop-types';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import classNames from 'classnames';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  pageSizes = [10, 25, 50, 100],
  className,
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= maxVisible; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div
      className={classNames(
        'flex flex-col sm:flex-row items-center justify-between gap-4',
        className
      )}
    >
      {/* Info + Page Size */}
      <div className="flex items-center gap-4 text-sm text-secondary-600 dark:text-secondary-400">
        <span>
          Showing <span className="font-medium">{startItem}</span> to{' '}
          <span className="font-medium">{endItem}</span> of{' '}
          <span className="font-medium">{totalItems}</span> results
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 text-sm rounded border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800"
          >
            {pageSizes.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Page Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="First page"
        >
          <ChevronsLeft size={16} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((page, index) =>
          page === '...' ? (
            <span
              key={`dots-${index}`}
              className="px-2 text-sm text-secondary-400"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={classNames(
                'min-w-[32px] h-8 px-2 text-sm font-medium rounded-lg transition-colors',
                currentPage === page
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-700'
              )}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page"
        >
          <ChevronRight size={16} />
        </button>
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg text-secondary-500 hover:bg-secondary-100 dark:hover:bg-secondary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Last page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  totalItems: PropTypes.number,
  pageSize: PropTypes.number,
  onPageChange: PropTypes.func.isRequired,
  onPageSizeChange: PropTypes.func,
  pageSizes: PropTypes.arrayOf(PropTypes.number),
  className: PropTypes.string,
};

export default Pagination;