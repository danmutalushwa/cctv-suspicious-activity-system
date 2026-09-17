import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Maximize2,
  Volume2,
  VolumeX,
  Camera as CameraIcon,
  Play,
  Square,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import classNames from 'classnames';
import { CameraStatus } from '../Cameras';
import { useFullscreen } from '../../hooks/useMonitoring';
import { CAMERA_STATUS } from '../../constants/cameraStatus';
import { useStartStream, useStopStream } from '../../hooks/useCameras';

const LiveCameraTile = ({
  camera,
  onSelect,
  isActive,
  controls = true,
  compact = false,
}) => {
  const tileRef = useRef(null);
  const { toggleFullscreen } = useFullscreen();
  const [isMuted, setIsMuted] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const [imageError, setImageError] = useState(false);

  const startMutation = useStartStream();
  const stopMutation = useStopStream();

  const isOnline =
    camera.status === CAMERA_STATUS.ONLINE ||
    camera.status === CAMERA_STATUS.RECORDING;
  const isRecording = camera.status === CAMERA_STATUS.RECORDING;

  const handleStartStream = (e) => {
    e.stopPropagation();
    startMutation.mutate(camera._id);
  };

  const handleStopStream = (e) => {
    e.stopPropagation();
    stopMutation.mutate(camera._id);
  };

  const handleFullscreen = (e) => {
    e.stopPropagation();
    toggleFullscreen(tileRef.current);
  };

  return (
    <div
      ref={tileRef}
      onClick={() => onSelect?.(camera)}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      className={classNames(
        'group relative bg-black rounded-lg overflow-hidden cursor-pointer transition-all',
        isActive && 'ring-2 ring-primary-500',
        !isOnline && 'opacity-75'
      )}
    >
      {/* Stream area */}
      <div className="relative aspect-video bg-gradient-to-br from-secondary-800 to-secondary-950">
        {isOnline && !imageError ? (
          <>
            {/* Placeholder visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-2">
                  <CameraIcon size={24} className="text-white/60" />
                </div>
                <p className="text-white/70 text-xs">Live Stream</p>
              </div>
            </div>

            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-danger-500 text-white text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                REC
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <CameraIcon size={32} className="text-secondary-600 mx-auto mb-2" />
              <p className="text-secondary-500 text-xs">Camera Offline</p>
            </div>
          </div>
        )}

        {/* Top overlay - name + status */}
        <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/70 to-transparent flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{camera.name}</p>
            <p className="text-white/60 text-xs truncate">{camera.location}</p>
          </div>
          <CameraStatus status={camera.status} size="sm" />
        </div>

        {/* Bottom overlay - controls */}
        <div
          className={classNames(
            'absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between gap-2 transition-opacity',
            controls && showControls ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="flex items-center gap-2">
            {isRecording ? (
              <button
                type="button"
                onClick={handleStopStream}
                disabled={stopMutation.isPending}
                className="p-2 rounded-lg bg-danger-500 hover:bg-danger-600 text-white transition-colors"
                title="Stop stream"
              >
                <Square size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStartStream}
                disabled={startMutation.isPending || !camera.isActive}
                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors disabled:opacity-50"
                title="Start stream"
              >
                <Play size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setImageError(false);
              }}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
            <button
              type="button"
              onClick={handleFullscreen}
              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
              title="Fullscreen"
            >
              <Maximize2 size={14} />
            </button>
          </div>
        </div>

        {/* Inactive overlay */}
        {!camera.isActive && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <span className="text-white/80 text-xs font-medium">Camera Disabled</span>
          </div>
        )}
      </div>
    </div>
  );
};

LiveCameraTile.propTypes = {
  camera: PropTypes.object.isRequired,
  onSelect: PropTypes.func,
  isActive: PropTypes.bool,
  controls: PropTypes.bool,
  compact: PropTypes.bool,
};

export default LiveCameraTile;