import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Upload, X, Video as VideoIcon, CheckCircle } from 'lucide-react';
import classNames from 'classnames';
import { useUploadVideo } from '../../hooks/useVideos';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Textarea from '../Forms/Textarea';
import { formatFileSize } from '../../utils/formatFileSize';

const VideoUploadModal = ({ isOpen, onClose }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const inputRef = useRef(null);

  const uploadMutation = useUploadVideo();

  const handleFile = (selectedFile) => {
    if (!selectedFile.type.startsWith('video/')) {
      alert('Please select a video file');
      return;
    }
    if (selectedFile.size > 100 * 1024 * 1024) {
      alert('Video size must be less than 100MB');
      return;
    }
    setFile(selectedFile);
    if (!title) setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleSubmit = async () => {
    if (!file) return;
    setProgress(0);

    try {
      await uploadMutation.mutateAsync({
        file,
        data: {
          title: title.trim(),
          description: description.trim(),
          isPublic: isPublic.toString(),
        },
        onProgress: (p) => setProgress(p),
      });
      setIsSuccess(true);
      setTimeout(() => {
        handleReset();
        onClose();
      }, 1500);
    } catch (error) {
      setProgress(0);
    }
  };

  const handleReset = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setIsPublic(false);
    setProgress(0);
    setIsSuccess(false);
  };

  const handleClose = () => {
    if (uploadMutation.isPending) return;
    handleReset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Video"
      size="lg"
      closeOnBackdrop={!uploadMutation.isPending}
      showCloseButton={!uploadMutation.isPending}
      footer={
        !isSuccess && (
          <>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={Upload}
              onClick={handleSubmit}
              loading={uploadMutation.isPending}
              disabled={!file || !title.trim()}
            >
              {uploadMutation.isPending ? `Uploading ${progress}%` : 'Upload Video'}
            </Button>
          </>
        )
      }
    >
      {isSuccess ? (
        <div className="text-center py-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center mb-4">
            <CheckCircle className="text-success-600 dark:text-success-400" size={32} />
          </div>
          <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
            Upload Complete!
          </h3>
          <p className="text-sm text-secondary-500">
            Your video is being processed and will be available shortly.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* File Drop Zone */}
          {!file ? (
            <div
              className={classNames(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                isDragging
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-secondary-300 dark:border-secondary-600 hover:border-primary-400'
              )}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])}
                className="hidden"
              />
              <VideoIcon size={40} className="mx-auto text-secondary-400 mb-3" />
              <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                {isDragging ? 'Drop video here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-secondary-500 mt-1">
                MP4, WebM, AVI, MOV up to 100MB
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-secondary-50 dark:bg-secondary-700/50 border border-secondary-200 dark:border-secondary-600">
              <VideoIcon size={24} className="text-primary-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-secondary-500">{formatFileSize(file.size)}</p>
              </div>
              {!uploadMutation.isPending && (
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="p-1 rounded text-secondary-400 hover:text-danger-500 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {uploadMutation.isPending && (
            <div>
              <div className="flex items-center justify-between text-xs text-secondary-500 mb-1.5">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-secondary-200 dark:bg-secondary-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Metadata */}
          <Input
            label="Title"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Video title"
            required
            disabled={uploadMutation.isPending}
          />

          <Textarea
            label="Description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={3}
            maxLength={500}
            disabled={uploadMutation.isPending}
          />

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={uploadMutation.isPending}
              className="rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-secondary-700 dark:text-secondary-300">
              Make this video public
            </span>
          </label>
        </div>
      )}
    </Modal>
  );
};

VideoUploadModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default VideoUploadModal;