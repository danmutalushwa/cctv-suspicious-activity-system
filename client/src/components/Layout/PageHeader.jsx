import PropTypes from 'prop-types';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const PageHeader = ({ title, subtitle, breadcrumbs = [], actions }) => {
  return (
    <div className="mb-6">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1.5 text-xs text-secondary-500 dark:text-secondary-400 mb-2">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <div key={index} className="flex items-center gap-1.5">
                {crumb.path && !isLast ? (
                  <Link
                    to={crumb.path}
                    className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'text-secondary-700 dark:text-secondary-300 font-medium' : ''}>
                    {crumb.label}
                  </span>
                )}
                {!isLast && <ChevronRight size={12} />}
              </div>
            );
          })}
        </nav>
      )}

      {/* Title + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-secondary-500 dark:text-secondary-400">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  breadcrumbs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      path: PropTypes.string,
    })
  ),
  actions: PropTypes.node,
};

export default PageHeader;