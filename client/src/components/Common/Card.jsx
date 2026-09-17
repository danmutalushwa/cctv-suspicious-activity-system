import PropTypes from 'prop-types';
import classNames from 'classnames';

const Card = ({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  padding = 'md',
  hover = false,
  className,
  ...props
}) => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={classNames(
        'bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 shadow-sm',
        hover && 'transition-shadow hover:shadow-md cursor-pointer',
        className
      )}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-secondary-200 dark:border-secondary-700 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-base font-semibold text-secondary-900 dark:text-white truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-secondary-500 dark:text-secondary-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
        </div>
      )}

      <div className={paddings[padding]}>{children}</div>

      {footer && (
        <div className="px-6 py-4 border-t border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-900/50 rounded-b-lg">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  headerAction: PropTypes.node,
  footer: PropTypes.node,
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  hover: PropTypes.bool,
  className: PropTypes.string,
};

export default Card;