import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Upload, X, File, Image as ImageIcon, Video } from 'lucide-react';
import { formatFileSize } from '../../utils/formatFileSize';

const FileUpload = ({
  label,
  name,
  accept = 'image/*',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB
  files = [],
  onChange,
  onRemove,
  error,
  touched,
  helperText,
  disabled = false,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef(null);

  const hasError = error && touched;

  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/')) return ImageIcon;
    if (file.type?.startsWith('video/')) return Video;
    return File;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
    e.target.value = null; // Reset input
  };

  const processFiles = (newFiles) => {
    const validFiles = newFiles.filter((file) => {
      if (file.size > maxSize) {
        alert(`File "${file.name}" exceeds maximum size of ${formatFileSize(maxSize)}`);
        return false;
      }
      return true;
    });

    if (onChange) {
      onChange(multiple ? [...files, ...validFiles] : validFiles.slice(0, 1));
    }
  };

  const handleRemove = (index) => {
    if (onRemove) {
      onRemove(index);
    } else if (onChange) {
      const newFiles = files.filter((_, i) => i !== index);
      onChange(newFiles);
    }
  };

  return (
    <div className={classNames('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1.5">
          {label}
        </label>
      )}

      <div
        className={classNames(
          'relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : hasError
              ? 'border-danger-300 dark:border-danger-700'
              : 'border-secondary-300 dark:border-secondary-600 hover:border-primary-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />

        <Upload
          size={32}
          className={classNames(
            'mx-auto mb-3',
            isDragging ? 'text-primary-500' : 'text-secondary-400'
          )}
        />

        <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
          {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-xs text-secondary-500 dark:text-secondary-400 mt-1">
          Max file size: {formatFileSize(maxSize)} {multiple && '• Multiple files allowed'}
        </p>
      </div>

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => {
            const Icon = getFileIcon(file);
            return (
              <li
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50 dark:bg-secondary-700/50 border border-secondary-200 dark:border-secondary-600"
              >
                <Icon size={18} className="text-secondary-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300 truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-secondary-500">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(index);
                    }}
                    className="p-1 rounded text-secondary-400 hover:text-danger-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

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
};

FileUpload.propTypes = {
  label: PropTypes.string,
  name: PropTypes.string.isRequired,
  accept: PropTypes.string,
  multiple: PropTypes.bool,
  maxSize: PropTypes.number,
  files: PropTypes.array,
  onChange: PropTypes.func,
  onRemove: PropTypes.func,
  error: PropTypes.string,
  touched: PropTypes.bool,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default FileUpload;