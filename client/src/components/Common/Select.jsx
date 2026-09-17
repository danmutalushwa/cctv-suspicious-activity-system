import PropTypes from 'prop-types';
import classNames from 'classnames';

const Select = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = 'Select an option',
  error,
  touched,
  required = false,
  disabled = false,
  className,
  ...props
}) => {
  const hasError = error && touched;

  return (
    <div className={classNames('w-full', className)}>
      {label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5"
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        className={classNames(
          'w-full px-3 py-2 text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
          'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100',
          hasError
            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-200'
            : 'border-secondary-300 dark:border-secondary-600 focus:border-primary-500 focus:ring-primary-200',
          disabled && 'bg-secondary-100 dark:bg-secondary-700 cursor-not-allowed'
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hasError && (
        <p className="mt-1.5 text-xs text-danger-600 dark:text-danger-400">{error}</p>
      )}
    </div>
  );
};

Select.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any.isRequired,
      label: PropTypes.string.isRequired,
    })
  ),
  placeholder: PropTypes.string,
  error: PropTypes.string,
  touched: PropTypes.bool,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default Select;