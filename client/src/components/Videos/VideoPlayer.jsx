import { useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward,
  Settings,
} from 'lucide-react';
import classNames from 'classnames';
import { formatDuration } from '../../utils/formatDate';

const VideoPlayer = ({ src, poster, autoPlay = false, onEnded }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const hideTimeoutRef = useRef(null);

  // Toggle play
  const togglePlay = () => {
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Handle time update
  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current.currentTime);
  };

  // Handle loaded metadata
  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration);
  };

  // Seek
  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Skip
  const skip = (seconds) => {
    videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
  };

  // Volume
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  // Toggle mute
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    videoRef.current.muted = newMuted;
  };

  // Change playback rate
  const changePlaybackRate = (rate) => {
    setPlaybackRate(rate);
    videoRef.current.playbackRate = rate;
    setShowSettings(false);
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  // Auto-hide controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    hideTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT') return;
      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          skip(-5);
          break;
        case 'ArrowRight':
          skip(5);
          break;
        case 'ArrowUp':
          setVolume((v) => Math.min(1, v + 0.1));
          break;
        case 'ArrowDown':
          setVolume((v) => Math.max(0, v - 0.1));
          break;
        case 'm':
          toggleMute();
          break;
        case 'f':
          toggleFullscreen();
          break;
        default:
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, duration, isPlaying, isMuted, volume]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
    }
  }, [volume]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full aspect-video"
        onClick={togglePlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => {
          setIsPlaying(false);
          if (onEnded) onEnded();
        }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        autoPlay={autoPlay}
        playsInline
      />

      {/* Center Play Button */}
      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
          aria-label="Play"
        >
          <div className="w-20 h-20 rounded-full bg-white/90 flex items-center justify-center">
            <Play size={32} className="text-primary-600 ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* Controls */}
      <div
        className={classNames(
          'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity',
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Progress Bar */}
        <div
          className="relative h-1 bg-white/30 rounded-full cursor-pointer group/progress mb-4"
          onClick={handleSeek}
        >
          <div
            className="absolute top-0 left-0 h-full bg-primary-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary-500 opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center gap-2 text-white">
          {/* Play/Pause */}
          <button
            type="button"
            onClick={togglePlay}
            className="p-2 hover:bg-white/20 rounded transition-colors"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          {/* Skip buttons */}
          <button
            type="button"
            onClick={() => skip(-10)}
            className="p-2 hover:bg-white/20 rounded transition-colors"
            aria-label="Skip back 10s"
          >
            <SkipBack size={18} />
          </button>
          <button
            type="button"
            onClick={() => skip(10)}
            className="p-2 hover:bg-white/20 rounded transition-colors"
            aria-label="Skip forward 10s"
          >
            <SkipForward size={18} />
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1 group/volume">
            <button
              type="button"
              onClick={toggleMute}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              aria-label="Toggle mute"
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-0 group-hover/volume:w-20 transition-all duration-200 accent-primary-500"
            />
          </div>

          {/* Time */}
          <span className="text-xs font-medium ml-1">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          <div className="flex-1" />

          {/* Settings */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-white/20 rounded transition-colors"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>

            {showSettings && (
              <div className="absolute bottom-12 right-0 w-40 bg-secondary-900/95 backdrop-blur rounded-lg overflow-hidden shadow-xl">
                <div className="px-3 py-2 text-xs text-white/60 border-b border-white/10">
                  Playback Speed
                </div>
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => changePlaybackRate(rate)}
                    className={classNames(
                      'w-full px-3 py-2 text-sm text-white text-left hover:bg-white/10 transition-colors',
                      playbackRate === rate && 'bg-white/10 text-primary-400'
                    )}
                  >
                    {rate}x {rate === 1 && '(Normal)'}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fullscreen */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/20 rounded transition-colors"
            aria-label="Fullscreen"
          >
            <Maximize size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

VideoPlayer.propTypes = {
  src: PropTypes.string.isRequired,
  poster: PropTypes.string,
  autoPlay: PropTypes.bool,
  onEnded: PropTypes.func,
};

export default VideoPlayer;