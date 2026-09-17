import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

const Textarea = forwardRef(({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false,
  placeholder,
  rows = 4,
  maxLength,
  helperText,
  className,
  ...props
}, ref) => {
  const hasError = error && touched;

  return (
    <div className={classNames('w-full', className)}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor={name}
            className="block text-sm font-medium text-secondary-700 dark:text-secondary-300"
          >
            {label}
            {required && <span className="text-danger-500 ml-1">*</span>}
          </label>
          {maxLength && (
            <span className="text-xs text-secondary-400">
              {value?.length || 0}/{maxLength}
            </span>
          )}
        </div>
      )}
      <textarea
        ref={ref}
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        className={classNames(
          'w-full px-3 py-2 text-sm rounded-lg border transition-colors resize-y',
          'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100',
          'placeholder:text-secondary-400',
          'focus:outline-none focus:ring-2 focus:ring-offset-0',
          hasError
            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-200'
            : 'border-secondary-300 dark:border-secondary-600 focus:border-primary-500 focus:ring-primary-200',
          disabled && 'bg-secondary-100 dark:bg-secondary-700 cursor-not-allowed'
        )}
        {...props}
      />
      {hasError && (
        <p className="mt-1.5 text-xs text-danger-600 dark:text-danger-400">{error}</p>
      )}
      {!hasError && helperText && (
        <p className="mt-1.5 text-xs text-secondary-500 dark:text-secondary-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';

Textarea.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  touched: PropTypes.bool,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  rows: PropTypes.number,
  maxLength: PropTypes.number,
  helperText: PropTypes.string,
  className: PropTypes.string,
};

export default Textarea;