import { useRef } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { Maximize2, Grid2x2, Grid3x3, LayoutGrid, Square } from 'lucide-react';
import LiveCameraTile from './LiveCameraTile';
import EmptyState from '../Common/EmptyState';
import { Camera as CameraIcon } from 'lucide-react';
import { useFullscreen } from '../../hooks/useMonitoring';

const CameraGridLayout = ({ cameras = [], activeCamera, onSelect }) => {
  const containerRef = useRef(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const layouts = [
    { id: '1x1', label: '1 × 1', icon: Square, cols: 1, max: 1 },
    { id: '2x2', label: '2 × 2', icon: Grid2x2, cols: 2, max: 4 },
    { id: '3x3', label: '3 × 3', icon: Grid3x3, cols: 3, max: 9 },
    { id: '4x4', label: '4 × 4', icon: LayoutGrid, cols: 4, max: 16 },
  ];

  // Determine cols based on count
  const cols =
    cameras.length <= 1 ? 1 :
    cameras.length <= 4 ? 2 :
    cameras.length <= 9 ? 3 : 4;

  if (cameras.length === 0) {
    return (
      <EmptyState
        icon={CameraIcon}
        title="No cameras available"
        description="Add cameras to view live monitoring."
      />
    );
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Fullscreen button */}
      <button
        type="button"
        onClick={() => toggleFullscreen(containerRef.current)}
        className="absolute top-3 right-3 z-20 p-2 rounded-lg bg-black/60 hover:bg-black/80 text-white transition-colors"
        title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
      >
        <Maximize2 size={16} />
      </button>

      {/* Grid */}
      <div
        className={classNames(
          'grid gap-2 md:gap-3',
          cols === 1 && 'grid-cols-1',
          cols === 2 && 'grid-cols-1 sm:grid-cols-2',
          cols === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
          cols === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        )}
      >
        {cameras.map((camera) => (
          <LiveCameraTile
            key={camera._id}
            camera={camera}
            onSelect={onSelect}
            isActive={activeCamera?._id === camera._id}
          />
        ))}
      </div>
    </div>
  );
};

CameraGridLayout.propTypes = {
  cameras: PropTypes.array,
  activeCamera: PropTypes.object,
  onSelect: PropTypes.func,
};

export default CameraGridLayout;