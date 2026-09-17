import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Trash2, Clock, HardDrive, Eye, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useVideo, useDeleteVideo } from '../../hooks/useVideos';
import { videosAPI } from '../../api/videos';
import { useAuth } from '../../hooks/useAuth';
import { hasPermission } from '../../utils/permissions';
import PageHeader from '../../components/Layout/PageHeader';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import LoadingScreen from '../../components/Common/LoadingScreen';
import Alert from '../../components/Common/Alert';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { VideoPlayer } from '../../components/Videos';
import { formatDate, formatDuration } from '../../utils/formatDate';
import { formatFileSize } from '../../utils/formatFileSize';
import { ROUTES } from '../../constants/routes';

const VideoDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isLoading, isError, error } = useVideo(id);
  const deleteMutation = useDeleteVideo();

  const video = data?.data?.video;
  const canDelete = hasPermission(user?.role, 'videos:delete');

  if (isLoading) return <LoadingScreen message="Loading video..." />;

  if (isError || !video) {
    return (
      <Alert
        type="danger"
        title="Video not found"
        message={error?.userMessage || 'The requested video could not be loaded.'}
      />
    );
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    navigate(ROUTES.VIDEOS);
  };

  const handleDownload = () => {
    window.open(videosAPI.getDownloadUrl(video._id), '_blank');
  };

  const streamUrl = videosAPI.getStreamUrl(video._id);

  return (
    <>
      <PageHeader
        title={video.title}
        subtitle={video.description}
        breadcrumbs={[
          { label: 'Videos', path: ROUTES.VIDEOS },
          { label: video.title },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => navigate(ROUTES.VIDEOS)}
            >
              Back
            </Button>
            <Button variant="outline" icon={Download} onClick={handleDownload}>
              Download
            </Button>
            {canDelete && (
              <Button variant="danger" icon={Trash2} onClick={() => setDeleteOpen(true)}>
                Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player */}
        <div className="lg:col-span-2 space-y-6">
          <VideoPlayer src={streamUrl} poster={video.thumbnailPath} />

          <Card title="About this video">
            <p className="text-sm text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap">
              {video.description || 'No description provided.'}
            </p>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card title="Details">
            <ul className="space-y-3 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-secondary-500 flex items-center gap-2">
                  <Badge variant="secondary" size="sm">
                    Status
                  </Badge>
                </span>
                <Badge variant={video.status === 'completed' ? 'success' : 'warning'} size="sm">
                  {video.status}
                </Badge>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-secondary-500 flex items-center gap-2">
                  <Clock size={14} />
                  Duration
                </span>
                <span className="font-medium">{formatDuration(video.duration)}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-secondary-500 flex items-center gap-2">
                  <HardDrive size={14} />
                  Size
                </span>
                <span className="font-medium">{formatFileSize(video.fileSize)}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-secondary-500 flex items-center gap-2">
                  <Eye size={14} />
                  Views
                </span>
                <span className="font-medium">{video.views || 0}</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-secondary-500 flex items-center gap-2">
                  <Calendar size={14} />
                  Uploaded
                </span>
                <span className="font-medium">
                  {formatDate(video.createdAt, 'MMM dd, yyyy')}
                </span>
              </li>
            </ul>
          </Card>

          {video.resolution && (
            <Card title="Technical">
              <ul className="space-y-3 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-secondary-500">Resolution</span>
                  <span className="font-medium">
                    {video.resolution.width} × {video.resolution.height}
                  </span>
                </li>
                {video.codec && (
                  <li className="flex items-center justify-between">
                    <span className="text-secondary-500">Codec</span>
                    <span className="font-medium uppercase">{video.codec}</span>
                  </li>
                )}
                {video.framerate && (
                  <li className="flex items-center justify-between">
                    <span className="text-secondary-500">Frame Rate</span>
                    <span className="font-medium">{video.framerate.toFixed(0)} fps</span>
                  </li>
                )}
                {video.bitrate && (
                  <li className="flex items-center justify-between">
                    <span className="text-secondary-500">Bitrate</span>
                    <span className="font-medium">
                      {Math.round(video.bitrate / 1000)} kbps
                    </span>
                  </li>
                )}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Video"
        message="Are you sure you want to delete this video? This action cannot be undone."
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />
    </>
  );
};

export default VideoDetails;