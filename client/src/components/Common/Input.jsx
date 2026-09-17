import { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  error,
  touched,
  required = false,
  disabled = false,
  placeholder,
  icon: Icon,
  helperText,
  className,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const hasError = error && touched;

  const inputType = isPassword && showPassword ? 'text' : type;

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
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon size={18} className="text-secondary-400" />
          </div>
        )}
        <input
          ref={ref}
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          placeholder={placeholder}
          className={classNames(
            'w-full rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
            'bg-white dark:bg-secondary-800 text-secondary-900 dark:text-secondary-100',
            'placeholder:text-secondary-400',
            Icon ? 'pl-10' : 'pl-3',
            isPassword ? 'pr-10' : 'pr-3',
            'py-2 text-sm',
            hasError
              ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-200'
              : 'border-secondary-300 dark:border-secondary-600 focus:border-primary-500 focus:ring-primary-200',
            disabled && 'bg-secondary-100 dark:bg-secondary-700 cursor-not-allowed',
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-secondary-400 hover:text-secondary-600"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {hasError && (
        <p className="mt-1.5 text-xs text-danger-600 dark:text-danger-400">{error}</p>
      )}
      {!hasError && helperText && (
        <p className="mt-1.5 text-xs text-secondary-500 dark:text-secondary-400">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.any,
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  error: PropTypes.string,
  touched: PropTypes.bool,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  icon: PropTypes.elementType,
  helperText: PropTypes.string,
  className: PropTypes.string,
};

export default Input;