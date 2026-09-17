import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Search, X } from 'lucide-react';
import classNames from 'classnames';
import { useDebounce } from '../../hooks/useDebounce';

const SearchBar = ({
  value = '',
  onChange,
  onSearch,
  placeholder = 'Search...',
  debounceDelay = 500,
  showClear = true,
  className,
}) => {
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, debounceDelay);

  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (onChange) onChange(newValue);
  };

  const handleClear = () => {
    setLocalValue('');
    if (onChange) onChange('');
    if (onSearch) onSearch('');
  };

  return (
    <div className={classNames('relative', className)}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400 pointer-events-none"
      />
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 text-sm rounded-lg border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white placeholder:text-secondary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
      />
      {showClear && localValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-secondary-400 hover:text-secondary-600 transition-colors"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

SearchBar.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onSearch: PropTypes.func,
  placeholder: PropTypes.string,
  debounceDelay: PropTypes.number,
  showClear: PropTypes.bool,
  className: PropTypes.string,
};

export default SearchBar;