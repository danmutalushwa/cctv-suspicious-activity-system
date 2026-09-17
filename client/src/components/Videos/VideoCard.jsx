import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Play, Clock, HardDrive, Eye, MoreVertical, Trash2, Download } from 'lucide-react';
import { useState } from 'react';
import Badge from '../Common/Badge';
import { formatFileSize } from '../../utils/formatFileSize';
import { formatDate, formatDuration } from '../../utils/formatDate';
import { buildRoute } from '../../constants/routes';
import { videosAPI } from '../../api/videos';
import classNames from 'classnames';

const VideoCard = ({ video, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);

  const getStatusVariant = (status) => {
    const variants = {
      completed: 'success',
      processing: 'warning',
      uploading: 'info',
      failed: 'danger',
    };
    return variants[status] || 'default';
  };

  const getThumbnailUrl = () => {
    if (imageError) return null;
    if (video.thumbnailPath) {
      const baseURL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      return `${baseURL}${video.thumbnailPath.startsWith('/') ? '' : '/'}${video.thumbnailPath}`;
    }
    return null;
  };

  const handleDownload = () => {
    window.open(videosAPI.getDownloadUrl(video._id), '_blank');
    setShowMenu(false);
  };

  const thumbnail = getThumbnailUrl();

  return (
    <div className="group bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-secondary-100 dark:bg-secondary-900">
        <Link to={buildRoute.videoDetails(video._id)} className="block w-full h-full">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={video.title}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary-200 to-secondary-300 dark:from-secondary-700 dark:to-secondary-800">
              <Play className="text-secondary-400" size={48} />
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/40 transition-colors">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="text-primary-600 ml-1" size={24} fill="currentColor" />
            </div>
          </div>

          {/* Duration badge */}
          {video.duration > 0 && (
            <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/80 text-white text-xs font-medium">
              {formatDuration(video.duration)}
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-2 left-2">
            <Badge variant={getStatusVariant(video.status)} size="sm">
              {video.status}
            </Badge>
          </div>
        </Link>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link
            to={buildRoute.videoDetails(video._id)}
            className="flex-1 min-w-0"
          >
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white truncate hover:text-primary-600 transition-colors">
              {video.title}
            </h3>
          </Link>

          {/* Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setShowMenu(!showMenu);
              }}
              onBlur={() => setTimeout(() => setShowMenu(false), 200)}
              className="p-1 rounded hover:bg-secondary-100 dark:hover:bg-secondary-700 transition-colors"
              aria-label="Options"
            >
              <MoreVertical size={16} className="text-secondary-500" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-10 w-40 bg-white dark:bg-secondary-800 rounded-lg shadow-dropdown border border-secondary-200 dark:border-secondary-700 py-1 animate-fade-in">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                >
                  <Download size={14} />
                  Download
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(video);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {video.description && (
          <p className="text-xs text-secondary-500 dark:text-secondary-400 line-clamp-2 mb-3">
            {video.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-secondary-500 dark:text-secondary-400">
          <div className="flex items-center gap-1">
            <HardDrive size={12} />
            <span>{formatFileSize(video.fileSize)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye size={12} />
            <span>{video.views || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{formatDate(video.createdAt, 'MMM dd, yyyy')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

VideoCard.propTypes = {
  video: PropTypes.object.isRequired,
  onDelete: PropTypes.func,
};

export default VideoCard;