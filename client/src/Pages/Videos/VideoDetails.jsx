import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Trash2,
  Clock,
  HardDrive,
  Eye,
  Calendar,
  Brain,
  CheckCircle,
  AlertTriangle,
  Activity,
  Target,
  ShieldAlert,
  Cpu,
  FileVideo,
} from 'lucide-react';
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

  const {
    data,
    isLoading,
    isError,
    error,
  } = useVideo(id);

  const deleteMutation = useDeleteVideo();

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (isLoading) {
    return (
      <LoadingScreen message="Loading video..." />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (isError || !data?.data?.video) {
    return (
      <Alert
        type="danger"
        title="Video not found"
        message={
          error?.userMessage ||
          'The requested video could not be loaded.'
        }
      />
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Video
  |--------------------------------------------------------------------------
  */

  const video = data.data.video;

  const canDelete = hasPermission(
    user?.role,
    'videos:delete'
  );

  /*
  |--------------------------------------------------------------------------
  | AI Analysis
  |--------------------------------------------------------------------------
  */

  const aiAnalysis = video.aiAnalysis || {};

  const aiStatus =
    aiAnalysis.status || 'not_started';

  const suspiciousFrames =
    aiAnalysis.suspiciousFrames || 0;

  const analyzedFrames =
    aiAnalysis.analyzedFrames || 0;

  const frameCount =
    aiAnalysis.frameCount || 0;

  const incidentsCreated =
    aiAnalysis.incidentsCreated || 0;

  const activities =
    Array.isArray(aiAnalysis.activities)
      ? aiAnalysis.activities
      : [];

  const detections =
    Array.isArray(aiAnalysis.detections)
      ? aiAnalysis.detections
      : [];

  /*
  |--------------------------------------------------------------------------
  | Handlers
  |--------------------------------------------------------------------------
  */

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(id);

      navigate(ROUTES.VIDEOS);
    } catch (error) {
      // Error notification is handled by the mutation hook.
    }
  };

  const handleDownload = () => {
    window.open(
      videosAPI.getDownloadUrl(video._id),
      '_blank'
    );
  };

  /*
  |--------------------------------------------------------------------------
  | URLs
  |--------------------------------------------------------------------------
  */
  const streamUrl = videosAPI.getStreamUrl(video._id);

  const posterUrl = video.thumbnailUrl || undefined;
  /*
  |--------------------------------------------------------------------------
  | Helpers
  |--------------------------------------------------------------------------
  */

  const getAIStatusVariant = () => {
    switch (aiStatus) {
      case 'completed':
        return 'success';

      case 'processing':
        return 'warning';

      case 'failed':
        return 'danger';

      default:
        return 'secondary';
    }
  };

  const getSeverityVariant = (severity) => {
    switch (severity) {
      case 'critical':
        return 'danger';

      case 'high':
        return 'danger';

      case 'medium':
        return 'warning';

      case 'low':
        return 'success';

      default:
        return 'secondary';
    }
  };

  const formatActivityName = (activity) => {
    if (!activity) return 'Unknown';

    return activity
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) =>
        char.toUpperCase()
      );
  };

  const formatConfidence = (confidence) => {
    if (
      confidence === undefined ||
      confidence === null
    ) {
      return 'N/A';
    }

    return `${Math.round(
      Number(confidence) * 100
    )}%`;
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <>
      <PageHeader
        title={video.title}
        subtitle={
          video.description ||
          'Video details and AI analysis'
        }
        breadcrumbs={[
          {
            label: 'Videos',
            path: ROUTES.VIDEOS,
          },
          {
            label: video.title,
          },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() =>
                navigate(ROUTES.VIDEOS)
              }
            >
              Back
            </Button>

            <Button
              variant="outline"
              icon={Download}
              onClick={handleDownload}
            >
              Download
            </Button>

            {canDelete && (
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() =>
                  setDeleteOpen(true)
                }
              >
                Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* =====================================================
            LEFT COLUMN
        ====================================================== */}

        <div className="lg:col-span-2 space-y-6">

          {/* Video Player */}

          <Card>
            <div className="overflow-hidden rounded-lg bg-black">
              <VideoPlayer
                src={streamUrl}
                poster={posterUrl}
              />
            </div>
          </Card>


          {/* ===================================================
              AI ANALYSIS
          ==================================================== */}

          <Card
            title="AI Analysis"
            icon={Brain}
          >
            <div className="space-y-6">

              {/* AI status */}

              <div className="flex items-center justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
                    <Brain
                      size={20}
                      className="text-primary-600"
                    />
                  </div>

                  <div>
                    <p className="font-medium">
                      AI Processing
                    </p>

                    <p className="text-sm text-secondary-500">
                      {aiStatus === 'completed'
                        ? 'Analysis completed'
                        : aiStatus === 'processing'
                        ? 'Analysis in progress'
                        : aiStatus === 'failed'
                        ? 'Analysis failed'
                        : 'Analysis not started'}
                    </p>
                  </div>

                </div>

                <Badge
                  variant={getAIStatusVariant()}
                  size="sm"
                >
                  {formatActivityName(aiStatus)}
                </Badge>

              </div>


              {/* AI statistics */}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

                <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-4">

                  <div className="flex items-center gap-2 text-secondary-500 mb-2">
                    <FileVideo size={16} />

                    <span className="text-xs">
                      Frames
                    </span>
                  </div>

                  <p className="text-2xl font-semibold">
                    {frameCount}
                  </p>

                </div>


                <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-4">

                  <div className="flex items-center gap-2 text-secondary-500 mb-2">
                    <Cpu size={16} />

                    <span className="text-xs">
                      Analyzed
                    </span>
                  </div>

                  <p className="text-2xl font-semibold">
                    {analyzedFrames}
                  </p>

                </div>


                <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-4">

                  <div className="flex items-center gap-2 text-secondary-500 mb-2">
                    <AlertTriangle size={16} />

                    <span className="text-xs">
                      Suspicious
                    </span>
                  </div>

                  <p className="text-2xl font-semibold">
                    {suspiciousFrames}
                  </p>

                </div>


                <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-4">

                  <div className="flex items-center gap-2 text-secondary-500 mb-2">
                    <ShieldAlert size={16} />

                    <span className="text-xs">
                      Incidents
                    </span>
                  </div>

                  <p className="text-2xl font-semibold">
                    {incidentsCreated}
                  </p>

                </div>

              </div>


              {/* Severity */}

              <div className="flex items-center justify-between border-t border-secondary-200 dark:border-secondary-700 pt-5">

                <div className="flex items-center gap-2">

                  <Activity
                    size={18}
                    className="text-secondary-500"
                  />

                  <span className="text-sm text-secondary-500">
                    Overall Severity
                  </span>

                </div>

                <Badge
                  variant={getSeverityVariant(
                    aiAnalysis.overallSeverity
                  )}
                >
                  {formatActivityName(
                    aiAnalysis.overallSeverity ||
                      'low'
                  )}
                </Badge>

              </div>


              {/* Activities */}

              {activities.length > 0 && (
                <div className="border-t border-secondary-200 dark:border-secondary-700 pt-5">

                  <div className="flex items-center gap-2 mb-3">

                    <Target
                      size={18}
                      className="text-secondary-500"
                    />

                    <h4 className="font-medium">
                      Detected Activities
                    </h4>

                  </div>

                  <div className="flex flex-wrap gap-2">

                    {activities.map(
                      (activity, index) => (
                        <Badge
                          key={`${activity}-${index}`}
                          variant="warning"
                        >
                          {formatActivityName(
                            activity
                          )}
                        </Badge>
                      )
                    )}

                  </div>

                </div>
              )}


              {/* No suspicious activity */}

              {aiStatus === 'completed' &&
                suspiciousFrames === 0 && (
                  <div className="rounded-lg border border-secondary-200 dark:border-secondary-700 bg-secondary-50 dark:bg-secondary-800/50 p-4">

                    <div className="flex items-center gap-3">

                      <CheckCircle
                        size={20}
                        className="text-green-500"
                      />

                      <div>
                        <p className="font-medium">
                          No suspicious activity detected
                        </p>

                        <p className="text-sm text-secondary-500">
                          The analyzed frames did not
                          contain activity classified
                          as suspicious.
                        </p>
                      </div>

                    </div>

                  </div>
                )}


              {/* AI error */}

              {aiStatus === 'failed' &&
                aiAnalysis.error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/20 p-4">

                    <div className="flex items-start gap-3">

                      <AlertTriangle
                        size={20}
                        className="text-red-500 mt-0.5"
                      />

                      <div>

                        <p className="font-medium text-red-700 dark:text-red-400">
                          AI analysis failed
                        </p>

                        <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                          {aiAnalysis.error}
                        </p>

                      </div>

                    </div>

                  </div>
                )}

            </div>
          </Card>


          {/* ===================================================
              DETECTIONS
          ==================================================== */}

          {detections.length > 0 && (
            <Card
              title={`Detected Events (${detections.length})`}
              icon={AlertTriangle}
            >

              <div className="space-y-3">

                {detections.map(
                  (detection, index) => (
                    <div
                      key={`${detection.frame}-${index}`}
                      className="rounded-lg border border-secondary-200 dark:border-secondary-700 p-4"
                    >

                      <div className="flex items-start justify-between gap-4">

                        <div className="space-y-2">

                          <div className="flex items-center gap-2">

                            <FileVideo
                              size={16}
                              className="text-secondary-500"
                            />

                            <span className="font-medium">
                              {detection.frame ||
                                `Frame ${index + 1}`}
                            </span>

                          </div>


                          {Array.isArray(
                            detection.activities
                          ) &&
                            detection.activities
                              .length > 0 && (
                              <div className="flex flex-wrap gap-2">

                                {detection.activities.map(
                                  (
                                    activity,
                                    activityIndex
                                  ) => (
                                    <Badge
                                      key={`${activity}-${activityIndex}`}
                                      variant="secondary"
                                      size="sm"
                                    >
                                      {formatActivityName(
                                        activity
                                      )}
                                    </Badge>
                                  )
                                )}

                              </div>
                            )}

                        </div>


                        <Badge
                          variant={getSeverityVariant(
                            detection.severity
                          )}
                          size="sm"
                        >
                          {formatActivityName(
                            detection.severity ||
                              'low'
                          )}
                        </Badge>

                      </div>


                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-secondary-200 dark:border-secondary-700">

                        <div>
                          <p className="text-xs text-secondary-500">
                            Confidence
                          </p>

                          <p className="font-medium mt-1">
                            {formatConfidence(
                              detection.confidence
                            )}
                          </p>
                        </div>


                        <div>
                          <p className="text-xs text-secondary-500">
                            Track ID
                          </p>

                          <p className="font-medium mt-1">
                            {detection.trackId ??
                              'N/A'}
                          </p>
                        </div>


                        <div>
                          <p className="text-xs text-secondary-500">
                            Zone
                          </p>

                          <p className="font-medium mt-1">
                            {detection.zone ||
                              'N/A'}
                          </p>
                        </div>


                        <div>
                          <p className="text-xs text-secondary-500">
                            Bounding Box
                          </p>

                          <p className="font-medium mt-1">
                            {Array.isArray(
                              detection.bbox
                            ) &&
                            detection.bbox.length
                              ? detection.bbox.join(
                                  ', '
                                )
                              : 'N/A'}
                          </p>
                        </div>

                      </div>

                    </div>
                  )
                )}

              </div>

            </Card>
          )}


          {/* ===================================================
              ABOUT VIDEO
          ==================================================== */}

          <Card title="About this video">

            <p className="text-sm text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap">
              {video.description ||
                'No description provided.'}
            </p>

          </Card>

        </div>


        {/* =====================================================
            RIGHT COLUMN
        ====================================================== */}

        <div className="space-y-6">

          {/* Video Details */}

          <Card title="Details">

            <ul className="space-y-4 text-sm">

              <li className="flex items-center justify-between gap-4">

                <span className="text-secondary-500">
                  Status
                </span>

                <Badge
                  variant={
                    video.status ===
                    'completed'
                      ? 'success'
                      : video.status ===
                        'failed'
                      ? 'danger'
                      : 'warning'
                  }
                  size="sm"
                >
                  {formatActivityName(
                    video.status
                  )}
                </Badge>

              </li>


              <li className="flex items-center justify-between gap-4">

                <span className="text-secondary-500 flex items-center gap-2">
                  <Clock size={14} />
                  Duration
                </span>

                <span className="font-medium">
                  {formatDuration(
                    video.duration
                  )}
                </span>

              </li>


              <li className="flex items-center justify-between gap-4">

                <span className="text-secondary-500 flex items-center gap-2">
                  <HardDrive size={14} />
                  Size
                </span>

                <span className="font-medium">
                  {formatFileSize(
                    video.fileSize
                  )}
                </span>

              </li>


              <li className="flex items-center justify-between gap-4">

                <span className="text-secondary-500 flex items-center gap-2">
                  <Eye size={14} />
                  Views
                </span>

                <span className="font-medium">
                  {video.views || 0}
                </span>

              </li>


              <li className="flex items-center justify-between gap-4">

                <span className="text-secondary-500 flex items-center gap-2">
                  <Download size={14} />
                  Downloads
                </span>

                <span className="font-medium">
                  {video.downloads || 0}
                </span>

              </li>


              <li className="flex items-center justify-between gap-4">

                <span className="text-secondary-500 flex items-center gap-2">
                  <Calendar size={14} />
                  Uploaded
                </span>

                <span className="font-medium">
                  {formatDate(
                    video.createdAt,
                    'MMM dd, yyyy'
                  )}
                </span>

              </li>

            </ul>

          </Card>


          {/* Technical information */}

          {video.resolution && (
            <Card title="Technical">

              <ul className="space-y-4 text-sm">

                <li className="flex items-center justify-between gap-4">

                  <span className="text-secondary-500">
                    Resolution
                  </span>

                  <span className="font-medium">
                    {video.resolution.width} ×{' '}
                    {video.resolution.height}
                  </span>

                </li>


                {video.codec && (
                  <li className="flex items-center justify-between gap-4">

                    <span className="text-secondary-500">
                      Codec
                    </span>

                    <span className="font-medium uppercase">
                      {video.codec}
                    </span>

                  </li>
                )}


                {video.framerate && (
                  <li className="flex items-center justify-between gap-4">

                    <span className="text-secondary-500">
                      Frame Rate
                    </span>

                    <span className="font-medium">
                      {Number(
                        video.framerate
                      ).toFixed(0)}{' '}
                      fps
                    </span>

                  </li>
                )}


                {video.bitrate && (
                  <li className="flex items-center justify-between gap-4">

                    <span className="text-secondary-500">
                      Bitrate
                    </span>

                    <span className="font-medium">
                      {Math.round(
                        video.bitrate / 1000
                      )}{' '}
                      kbps
                    </span>

                  </li>
                )}

              </ul>

            </Card>
          )}


          {/* AI Model */}

          {aiAnalysis.model && (
            <Card title="AI Model">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">

                  <Cpu
                    size={20}
                    className="text-primary-600"
                  />

                </div>

                <div>

                  <p className="font-medium">
                    {aiAnalysis.model}
                  </p>

                  {aiAnalysis.processedAt && (
                    <p className="text-xs text-secondary-500 mt-1">
                      Processed{' '}
                      {formatDate(
                        aiAnalysis.processedAt,
                        'MMM dd, yyyy HH:mm'
                      )}
                    </p>
                  )}

                </div>

              </div>

            </Card>
          )}

        </div>

      </div>


      {/* =======================================================
          DELETE CONFIRMATION
      ======================================================== */}

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() =>
          setDeleteOpen(false)
        }
        onConfirm={handleDelete}
        title="Delete Video"
        message="Are you sure you want to delete this video? This action cannot be undone."
        confirmText="Delete"
        loading={
          deleteMutation.isPending
        }
      />
    </>
  );
};

export default VideoDetails;