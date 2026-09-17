import { useState } from 'react';
import PropTypes from 'prop-types';
import { Upload, X, File, Image as ImageIcon, Video } from 'lucide-react';
import classNames from 'classnames';
import { formatFileSize } from '../../utils/formatFileSize';

const EvidenceUploader = ({ onUpload, uploading = false, accept = 'image/*,video/*', maxFiles = 10 }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    addFiles(dropped);
  };

  const handleInputChange = (e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = null;
  };

  const addFiles = (newFiles) => {
    const combined = [...files, ...newFiles].slice(0, maxFiles);
    setFiles(combined);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = () => {
    if (files.length === 0) return;
    onUpload(files);
    setFiles([]);
  };

  const getIcon = (file) => {
    if (file.type.startsWith('image/')) return ImageIcon;
    if (file.type.startsWith('video/')) return Video;
    return File;
  };

  return (
    <div className="space-y-4">
      <div
        className={classNames(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-secondary-300 dark:border-secondary-600 hover:border-primary-400'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('evidence-input')?.click()}
      >
        <input
          id="evidence-input"
          type="file"
          multiple
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
        />
        <Upload size={32} className="mx-auto text-secondary-400 mb-2" />
        <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
          {isDragging ? 'Drop files here' : 'Click to upload or drag and drop'}
        </p>
        <p className="text-xs text-secondary-500 mt-1">
          Images & videos, up to {maxFiles} files
        </p>
      </div>

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file, index) => {
            const Icon = getIcon(file);
            return (
              <li
                key={index}
                className="flex items-center gap-3 p-3 rounded-lg bg-secondary-50 dark:bg-secondary-700/50 border border-secondary-200 dark:border-secondary-600"
              >
                <Icon size={18} className="text-secondary-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                    {file.name}
                  </p>
                  <p className="text-xs text-secondary-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 rounded text-secondary-400 hover:text-danger-500 transition-colors"
                >
                  <X size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {files.length > 0 && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="w-full py-2 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {uploading ? 'Uploading...' : `Upload ${files.length} file(s)`}
        </button>
      )}
    </div>
  );
};

EvidenceUploader.propTypes = {
  onUpload: PropTypes.func.isRequired,
  uploading: PropTypes.bool,
  accept: PropTypes.string,
  maxFiles: PropTypes.number,
};

export default EvidenceUploader;