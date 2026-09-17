import PropTypes from 'prop-types';
import CameraCard from './CameraCard';
import EmptyState from '../Common/EmptyState';
import { Camera as CameraIcon } from 'lucide-react';

const CameraGrid = ({ cameras = [], loading = false, onDelete }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="aspect-video bg-secondary-100 dark:bg-secondary-800 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (cameras.length === 0) {
    return (
      <EmptyState
        icon={CameraIcon}
        title="No cameras found"
        description="Add your first camera to start monitoring."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {cameras.map((camera) => (
        <CameraCard key={camera._id} camera={camera} onDelete={onDelete} />
      ))}
    </div>
  );
};

CameraGrid.propTypes = {
  cameras: PropTypes.array,
  loading: PropTypes.bool,
  onDelete: PropTypes.func,
};

export default CameraGrid;