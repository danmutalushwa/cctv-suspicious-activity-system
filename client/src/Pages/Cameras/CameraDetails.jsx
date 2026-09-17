import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Trash2,
  Play,
  Square,
  RefreshCw,
  Wifi,
  MapPin,
  Camera as CameraIcon,
  Activity,
} from 'lucide-react';
import {
  useCamera,
  useDeleteCamera,
  useStartStream,
  useStopStream,
  useTestCameraConnection,
  useUpdateCamera,
} from '../../hooks/useCameras';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission } from '../../utils/permissions';
import PageHeader from '../../components/Layout/PageHeader';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import LoadingScreen from '../../components/Common/LoadingScreen';
import Alert from '../../components/Common/Alert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { CameraStatus, CameraForm } from '../../components/Cameras';
import { CAMERA_STATUS } from '../../constants/cameraStatus';
import { formatDate, formatRelativeTime } from '../../utils/formatDate';
import { ROUTES } from '../../constants/routes';

const CameraDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data, isLoading, isError, error } = useCamera(id);
  const deleteMutation = useDeleteCamera();
  const startMutation = useStartStream();
  const stopMutation = useStopStream();
  const testMutation = useTestCameraConnection();
  const updateMutation = useUpdateCamera();

  const camera = data?.data?.camera;
  const canManage = hasPermission(user?.role, 'cameras:create');

  if (isLoading) return <LoadingScreen message="Loading camera..." />;

  if (isError || !camera) {
    return (
      <Alert
        type="danger"
        title="Camera not found"
        message={error?.userMessage || 'The requested camera could not be loaded.'}
      />
    );
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    navigate(ROUTES.CAMERAS);
  };

  const handleStartStream = () => startMutation.mutate(id);
  const handleStopStream = () => stopMutation.mutate(id);
  const handleTest = () => testMutation.mutate(id);

  const handleUpdate = async (payload) => {
    await updateMutation.mutateAsync({ id, data: payload });
    setIsEditing(false);
  };

  const isOnline = camera.status === CAMERA_STATUS.ONLINE || camera.status === CAMERA_STATUS.RECORDING;
  const isRecording = camera.status === CAMERA_STATUS.RECORDING;

  if (isEditing) {
    return (
      <>
        <PageHeader
          title={`Edit ${camera.name}`}
          breadcrumbs={[
            { label: 'Cameras', path: ROUTES.CAMERAS },
            { label: camera.name, path: `/cameras/${id}` },
            { label: 'Edit' },
          ]}
          actions={
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
          }
        />
        <div className="max-w-3xl">
          <CameraForm
            initialData={camera}
            onSubmit={handleUpdate}
            loading={updateMutation.isPending}
            isEdit
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={camera.name}
        subtitle={camera.location}
        breadcrumbs={[
          { label: 'Cameras', path: ROUTES.CAMERAS },
          { label: camera.name },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => navigate(ROUTES.CAMERAS)}
            >
              Back
            </Button>
            {canManage && (
              <>
                <Button variant="primary" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  icon={Trash2}
                  onClick={() => setDeleteOpen(true)}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Live Preview */}
          <Card>
            <div className="aspect-video bg-gradient-to-br from-secondary-800 to-secondary-900 rounded-lg relative overflow-hidden">
              {isOnline ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-3">
                        <Activity size={32} className="text-white animate-pulse" />
                      </div>
                      <p className="text-white/80 text-sm font-medium">
                        {isRecording ? 'Recording in progress' : 'Live stream active'}
                      </p>
                      <p className="text-white/50 text-xs mt-1">
                        Stream URL: {camera.rtspUrl}
                      </p>
                    </div>
                  </div>
                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-danger-500 text-white text-sm font-semibold">
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      RECORDING
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <CameraStatus status={camera.status} />
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <CameraIcon size={64} className="text-secondary-600 mx-auto mb-3" />
                    <p className="text-secondary-400 text-sm">Camera is offline</p>
                  </div>
                </div>
              )}
            </div>

            {/* Controls */}
            {canManage && (
              <div className="flex items-center gap-2 mt-4">
                {!isRecording ? (
                  <Button
                    variant="primary"
                    icon={Play}
                    onClick={handleStartStream}
                    loading={startMutation.isPending}
                    disabled={!isOnline && camera.status !== CAMERA_STATUS.OFFLINE}
                  >
                    Start Stream
                  </Button>
                ) : (
                  <Button
                    variant="danger"
                    icon={Square}
                    onClick={handleStopStream}
                    loading={stopMutation.isPending}
                  >
                    Stop Stream
                  </Button>
                )}
                <Button
                  variant="outline"
                  icon={RefreshCw}
                  onClick={handleTest}
                  loading={testMutation.isPending}
                >
                  Test Connection
                </Button>
              </div>
            )}
          </Card>

          {/* Details */}
          <Card title="Camera Details">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-secondary-500 flex items-center gap-2">
                  <MapPin size={14} /> Location
                </span>
                <span className="font-medium">{camera.location}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-secondary-500 flex items-center gap-2">
                  <Wifi size={14} /> IP Address
                </span>
                <span className="font-mono text-xs">{camera.ipAddress}</span>
              </li>
              <li className="flex items-start justify-between gap-4">
                <span className="text-secondary-500 flex items-center gap-2 flex-shrink-0">
                  <CameraIcon size={14} /> RTSP URL
                </span>
                <span className="font-mono text-xs text-right break-all">
                  {camera.rtspUrl}
                </span>
              </li>
              {camera.resolution && (
                <li className="flex items-center justify-between">
                  <span className="text-secondary-500">Resolution</span>
                  <span className="font-medium">{camera.resolution}</span>
                </li>
              )}
              {camera.frameRate && (
                <li className="flex items-center justify-between">
                  <span className="text-secondary-500">Frame Rate</span>
                  <span className="font-medium">{camera.frameRate} fps</span>
                </li>
              )}
            </ul>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card title="Status">
            <div className="space-y-3">
              <CameraStatus status={camera.status} />
              <Badge variant={camera.isActive ? 'success' : 'secondary'} dot>
                {camera.isActive ? 'Enabled' : 'Disabled'}
              </Badge>
              {camera.createdAt && (
                <p className="text-xs text-secondary-500">
                  Added {formatRelativeTime(camera.createdAt)}
                </p>
              )}
            </div>
          </Card>

          {camera.assignedTo && (
            <Card title="Assigned To">
              <p className="text-sm font-medium text-secondary-900 dark:text-white">
                {camera.assignedTo.name}
              </p>
              <p className="text-xs text-secondary-500">{camera.assignedTo.email}</p>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Camera"
        message={`Are you sure you want to delete "${camera.name}"? This action cannot be undone.`}
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </>
  );
};

export default CameraDetails;