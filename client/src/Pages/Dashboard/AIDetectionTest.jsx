import { useState, useRef } from 'react';
import {
  Brain,
  Upload,
  X,
  CheckCircle,
  AlertTriangle,
  Activity,
  Camera as CameraIcon,
  Play,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAnalyzeImage, useAnalyzeAndReport, useAIHealth } from '../../hooks/useAI';
import { useCameras } from '../../hooks/useCameras';
import PageHeader from '../../components/Layout/PageHeader';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Select from '../../components/Common/Select';
import Badge from '../../components/Common/Badge';
import Alert from '../../components/Common/Alert';
import { buildRoute, ROUTES } from '../../constants/routes';
import { formatFileSize } from '../../utils/formatFileSize';

const AIDetectionTest = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cameraId, setCameraId] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [createdIncident, setCreatedIncident] = useState(null);
  const [createdAlert, setCreatedAlert] = useState(null);
  const inputRef = useRef(null);

  const { data: healthData, isLoading: healthLoading } = useAIHealth();
  const { data: camerasData } = useCameras({ limit: 100 });
  const analyzeMutation = useAnalyzeImage();
  const reportMutation = useAnalyzeAndReport();

  const cameras = camerasData?.data?.cameras || [];
  const aiHealthy = healthData?.data?.healthy;

  const cameraOptions = [
    { value: '', label: 'No camera (standalone)' },
    ...cameras.map((c) => ({ value: c._id, label: `${c.name} — ${c.location}` })),
  ];

  const handleFile = (selected) => {
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      alert('Image must be under 10MB');
      return;
    }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setAiResult(null);
    setCreatedIncident(null);
    setCreatedAlert(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleReset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setAiResult(null);
    setCreatedIncident(null);
    setCreatedAlert(null);
  };

  const handleAnalyzeOnly = async () => {
    if (!file) return;
    const result = await analyzeMutation.mutateAsync(file);
    setAiResult(result.data);
    setCreatedIncident(null);
    setCreatedAlert(null);
  };

  const handleAnalyzeAndReport = async () => {
    if (!file) return;
    const result = await reportMutation.mutateAsync({
      file,
      cameraId: cameraId || undefined,
    });
    setAiResult(result.data.ai);
    setCreatedIncident(result.data.incident);
    setCreatedAlert(result.data.alert);
  };

  const isLoading = analyzeMutation.isPending || reportMutation.isPending;

  return (
    <>
      <PageHeader
        title="AI Detection Test"
        subtitle="Test suspicious activity detection end-to-end"
        breadcrumbs={[
          { label: 'Dashboard', path: ROUTES.DASHBOARD },
          { label: 'AI Test' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {healthLoading ? (
              <Badge variant="secondary">Checking AI…</Badge>
            ) : aiHealthy ? (
              <Badge variant="success" dot>
                AI Service Online
              </Badge>
            ) : (
              <Badge variant="danger" dot>
                AI Service Offline
              </Badge>
            )}
          </div>
        }
      />

      {!aiHealthy && !healthLoading && (
        <Alert
          type="warning"
          title="AI Service Unavailable"
          message="Start the Python AI service on port 5001 to enable detection."
          className="mb-6"
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-6">
          <Card title="1. Upload Image" subtitle="JPG/PNG up to 10MB">
            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-secondary-300 dark:border-secondary-600 hover:border-primary-400'
                }`}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFile(e.target.files[0])}
                  className="hidden"
                />
                <Upload size={40} className="mx-auto text-secondary-400 mb-3" />
                <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-xs text-secondary-500 mt-1">
                  Tip: use a photo with people in it for best results
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden bg-secondary-100 dark:bg-secondary-900">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleReset}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-secondary-500">
                  <span>{file.name}</span>
                  <span>{formatFileSize(file.size)}</span>
                </div>
              </div>
            )}
          </Card>

          <Card title="2. Choose Camera (optional)">
            <Select
              name="cameraId"
              value={cameraId}
              onChange={(e) => setCameraId(e.target.value)}
              options={cameraOptions}
              helperText="Links the incident to a specific camera and location"
            />
          </Card>

          <Card title="3. Run Detection">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                icon={Activity}
                onClick={handleAnalyzeOnly}
                loading={analyzeMutation.isPending}
                disabled={!file || isLoading}
                className="flex-1"
              >
                Analyze Only
              </Button>
              <Button
                variant="primary"
                icon={Brain}
                onClick={handleAnalyzeAndReport}
                loading={reportMutation.isPending}
                disabled={!file || isLoading}
                className="flex-1"
              >
                Analyze & Report
              </Button>
            </div>
            <p className="text-xs text-secondary-500 mt-3">
              <strong>Analyze Only</strong> returns raw AI output.
              <br />
              <strong>Analyze & Report</strong> creates an incident + alert if suspicious.
            </p>
          </Card>
        </div>

        {/* Right: Results */}
        <div className="space-y-6">
          {aiResult && (
            <Card
              title="AI Result"
              headerAction={
                aiResult.is_suspicious ? (
                  <Badge variant="danger" dot>
                    Suspicious
                  </Badge>
                ) : (
                  <Badge variant="success" dot>
                    Not Suspicious
                  </Badge>
                )
              }
            >
              <ul className="space-y-2 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-secondary-500">Detected activities</span>
                  <span className="font-medium">{aiResult.count || 0}</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-secondary-500">Overall severity</span>
                  <Badge variant="warning" size="sm">
                    {aiResult.overall_severity || 'low'}
                  </Badge>
                </li>
              </ul>

              {aiResult.suspicious_activities?.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-secondary-700 dark:text-secondary-300">
                    Detected suspicious activities:
                  </p>
                  {aiResult.suspicious_activities.map((act, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg bg-secondary-50 dark:bg-secondary-700/50 text-sm"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle size={14} className="text-warning-500" />
                        <span className="font-medium">
                          {act.activities?.join(', ') || 'unknown'}
                        </span>
                        <Badge variant="warning" size="sm">
                          {act.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-secondary-500">
                        Confidence: {(act.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {createdIncident && (
            <Card
              title="Incident Created"
              headerAction={
                <Badge variant="success" dot>
                  New
                </Badge>
              }
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={18} className="text-success-600 dark:text-success-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                    {createdIncident.title}
                  </p>
                  <p className="text-xs text-secondary-500 font-mono">
                    {createdIncident.incidentNumber}
                  </p>
                  <Link
                    to={buildRoute.incidentDetails(createdIncident._id)}
                    className="mt-2 inline-block text-xs font-medium text-primary-600 hover:underline"
                  >
                    View incident →
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {createdAlert && (
            <Card title="Alert Sent" headerAction={<Badge variant="danger" dot>Live</Badge>}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center flex-shrink-0">
                  <Activity size={18} className="text-danger-600 dark:text-danger-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary-900 dark:text-white truncate">
                    {createdAlert.title}
                  </p>
                  <p className="text-xs text-secondary-500 mt-0.5">
                    {createdAlert.message}
                  </p>
                </div>
              </div>
              <p className="text-xs text-secondary-500 mt-3">
                🔔 Check the notification bell — it should update in real time.
              </p>
            </Card>
          )}

          {!aiResult && !isLoading && (
            <Card>
              <div className="text-center py-12">
                <Brain size={40} className="mx-auto text-secondary-400 mb-3" />
                <p className="text-sm font-medium text-secondary-700 dark:text-secondary-300">
                  No analysis yet
                </p>
                <p className="text-xs text-secondary-500 mt-1">
                  Upload an image and click "Analyze & Report"
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default AIDetectionTest;