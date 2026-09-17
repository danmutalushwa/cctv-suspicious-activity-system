import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Camera as CameraIcon,
  MapPin,
  Wifi,
  Play,
  MoreVertical,
  Trash2,
  Settings as SettingsIcon,
  Activity,
} from 'lucide-react';
import { useState } from 'react';
import CameraStatus from './CameraStatus';
import Badge from '../Common/Badge';
import { buildRoute } from '../../constants/routes';
import { CAMERA_STATUS } from '../../constants/cameraStatus';

const CameraCard = ({ camera, onDelete }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [imageError, setImageError] = useState(false);

  const isOnline = camera.status === CAMERA_STATUS.ONLINE || camera.status === CAMERA_STATUS.RECORDING;

  return (
    <div className="group bg-white dark:bg-secondary-800 rounded-lg border border-secondary-200 dark:border-secondary-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Preview */}
      <div className="relative aspect-video bg-gradient-to-br from-secondary-800 to-secondary-900">
        {isOnline && !imageError ? (
          <div className="w-full h-full relative">
            {/* Simulated live preview */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-2">
                  <Activity size={24} className="text-white animate-pulse" />
                </div>
                <p className="text-xs text-white/80 font-medium">Live Feed</p>
              </div>
            </div>

            {/* Recording indicator */}
            {camera.status === CAMERA_STATUS.RECORDING && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-danger-500 text-white text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                REC
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CameraIcon size={48} className="text-secondary-600" />
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-2 right-2">
          <CameraStatus status={camera.status} size="sm" />
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <Link
            to={buildRoute.cameraDetails(camera._id)}
            className="flex-1 min-w-0"
          >
            <h3 className="text-sm font-semibold text-secondary-900 dark:text-white truncate hover:text-primary-600 transition-colors">
              {camera.name}
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
            >
              <MoreVertical size={16} className="text-secondary-500" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-8 z-10 w-40 bg-white dark:bg-secondary-800 rounded-lg shadow-dropdown border border-secondary-200 dark:border-secondary-700 py-1 animate-fade-in">
                <Link
                  to={buildRoute.cameraDetails(camera._id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-secondary-700 dark:text-secondary-300 hover:bg-secondary-100 dark:hover:bg-secondary-700"
                >
                  <SettingsIcon size={14} />
                  Configure
                </Link>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(camera);
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

        <div className="space-y-1.5 text-xs text-secondary-500 dark:text-secondary-400">
          <div className="flex items-center gap-1.5">
            <MapPin size={12} />
            <span className="truncate">{camera.location}</span>
          </div>
          {camera.ipAddress && (
            <div className="flex items-center gap-1.5">
              <Wifi size={12} />
              <span className="font-mono">{camera.ipAddress}</span>
            </div>
          )}
          {camera.resolution && (
            <div className="flex items-center gap-1.5">
              <CameraIcon size={12} />
              <span>{camera.resolution} {camera.frameRate ? `· ${camera.frameRate}fps` : ''}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

CameraCard.propTypes = {
  camera: PropTypes.object.isRequired,
  onDelete: PropTypes.func,
};

export default CameraCard;