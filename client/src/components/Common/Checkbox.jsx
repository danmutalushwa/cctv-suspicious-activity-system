import PropTypes from 'prop-types';
import classNames from 'classnames';

const Checkbox = ({
  label,
  name,
  checked = false,
  onChange,
  disabled = false,
  error,
  className,
  ...props
}) => {
  return (
    <div className={classNames('flex items-start', className)}>
      <div className="flex items-center h-5">
        <input
          id={name}
          name={name}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className={classNames(
            'h-4 w-4 rounded border-secondary-300 text-primary-600',
            'focus:ring-2 focus:ring-primary-500 focus:ring-offset-0',
            'transition-colors cursor-pointer',
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-danger-500'
          )}
          {...props}
        />
      </div>
      {label && (
        <label
          htmlFor={name}
          className={classNames(
            'ml-2 text-sm text-secondary-700 dark:text-secondary-300 cursor-pointer select-none',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {label}
        </label>
      )}
    </div>
  );
};

Checkbox.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  className: PropTypes.string,
};

export default Checkbox;