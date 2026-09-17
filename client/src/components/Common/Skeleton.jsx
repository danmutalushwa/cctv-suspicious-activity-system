import PropTypes from 'prop-types';
import classNames from 'classnames';

const Skeleton = ({ variant = 'text', width, height, className, count = 1 }) => {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-6 rounded',
    circle: 'rounded-full',
    rect: 'rounded-lg',
  };

  const style = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={classNames(
              'bg-secondary-200 dark:bg-secondary-700 animate-pulse',
              variants[variant],
              className
            )}
            style={style}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={classNames(
        'bg-secondary-200 dark:bg-secondary-700 animate-pulse',
        variants[variant],
        className
      )}
      style={style}
    />
  );
};

Skeleton.propTypes = {
  variant: PropTypes.oneOf(['text', 'title', 'circle', 'rect']),
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  className: PropTypes.string,
  count: PropTypes.number,
};

export default Skeleton;