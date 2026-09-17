import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  UserPlus,
  CheckCircle,
  MapPin,
  Clock,
  AlertTriangle,
  FileImage,
} from 'lucide-react';
import {
  useIncident,
  useDeleteIncident,
  useAssignIncident,
  useResolveIncident,
  useAddIncidentNote,
  useUploadEvidence,
} from '../../hooks/useIncidents';
import { useAuth } from '../../hooks/useAuth';
import { isAdmin, canDeleteIncidents } from '../../utils/permissions';
import PageHeader from '../../components/Layout/PageHeader';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Badge from '../../components/Common/Badge';
import Modal from '../../components/Common/Modal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import Textarea from '../../components/Forms/Textarea';
import LoadingScreen from '../../components/Common/LoadingScreen';
import Alert from '../../components/Common/Alert';
import {
  EvidenceUploader,
  IncidentTimeline,
} from '../../components/Incidents';
import {
  INCIDENT_STATUS_COLORS,
  INCIDENT_STATUS_LABELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
} from '../../constants/status';
import { INCIDENT_TYPE_LABELS } from '../../constants/incidentTypes';
import { formatDate, formatRelativeTime } from '../../utils/formatDate';
import { ROUTES, buildRoute } from '../../constants/routes';

const IncidentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading, isError, error } = useIncident(id);
  const deleteMutation = useDeleteIncident();
  const assignMutation = useAssignIncident();
  const resolveMutation = useResolveIncident();
  const noteMutation = useAddIncidentNote();
  const evidenceMutation = useUploadEvidence();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');

  const incident = data?.data?.incident;

  if (isLoading) return <LoadingScreen message="Loading incident..." />;

  if (isError || !incident) {
    return (
      <Alert
        type="danger"
        title="Incident not found"
        message={error?.userMessage || 'The requested incident could not be loaded.'}
      />
    );
  }

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(id);
    setDeleteOpen(false);
    navigate(ROUTES.INCIDENTS);
  };

  const handleResolve = async () => {
    await resolveMutation.mutateAsync({
      id,
      data: { resolutionNotes: resolveNotes, actionTaken },
    });
    setResolveOpen(false);
    setResolveNotes('');
    setActionTaken('');
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    await noteMutation.mutateAsync({
      id,
      data: { text: noteText.trim(), isInternal: false },
    });
    setNoteText('');
  };

  const handleUploadEvidence = async (files) => {
    await evidenceMutation.mutateAsync({
      id,
      files,
      type: 'image',
    });
  };

  return (
    <>
      <PageHeader
        title={incident.title}
        subtitle={`Incident ${incident.incidentNumber}`}
        breadcrumbs={[
          { label: 'Incidents', path: ROUTES.INCIDENTS },
          { label: incident.incidentNumber },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              icon={ArrowLeft}
              onClick={() => navigate(ROUTES.INCIDENTS)}
            >
              Back
            </Button>
            {canDeleteIncidents(user?.role) && (
              <Button
                variant="danger"
                icon={Trash2}
                onClick={() => setDeleteOpen(true)}
              >
                Delete
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          <Card title="Summary">
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant={SEVERITY_COLORS[incident.severity]} dot>
                {SEVERITY_LABELS[incident.severity]}
              </Badge>
              <Badge variant={INCIDENT_STATUS_COLORS[incident.status]} dot>
                {INCIDENT_STATUS_LABELS[incident.status]}
              </Badge>
              <Badge variant="default">
                {INCIDENT_TYPE_LABELS[incident.type] || incident.type}
              </Badge>
            </div>

            <p className="text-sm text-secondary-700 dark:text-secondary-300 whitespace-pre-wrap">
              {incident.description}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-secondary-200 dark:border-secondary-700">
              <div>
                <p className="text-xs text-secondary-500 mb-1">Detected At</p>
                <p className="text-sm font-medium text-secondary-900 dark:text-white">
                  {formatDate(incident.detectedAt, 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              {incident.location?.address && (
                <div>
                  <p className="text-xs text-secondary-500 mb-1">Location</p>
                  <p className="text-sm font-medium text-secondary-900 dark:text-white flex items-center gap-1">
                    <MapPin size={14} />
                    {incident.location.address}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs text-secondary-500 mb-1">Reported By</p>
                <p className="text-sm font-medium text-secondary-900 dark:text-white">
                  {incident.reportedBy?.name || '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary-500 mb-1">Assigned To</p>
                <p className="text-sm font-medium text-secondary-900 dark:text-white">
                  {incident.assignedTo?.name || 'Unassigned'}
                </p>
              </div>
              {incident.confidence > 0 && (
                <div>
                  <p className="text-xs text-secondary-500 mb-1">AI Confidence</p>
                  <p className="text-sm font-medium text-secondary-900 dark:text-white">
                    {(incident.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Evidence */}
          <Card
            title="Evidence"
            subtitle={`${incident.evidence?.length || 0} file(s)`}
          >
            {incident.evidence?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                {incident.evidence.map((ev, index) => (
                  <a
                    key={index}
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square rounded-lg overflow-hidden border border-secondary-200 dark:border-secondary-700"
                  >
                    {ev.type === 'image' ? (
                      <img
                        src={ev.url}
                        alt={ev.fileName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-secondary-100 dark:bg-secondary-700">
                        <FileImage className="text-secondary-400" size={32} />
                      </div>
                    )}
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-secondary-500 mb-4">No evidence uploaded yet.</p>
            )}

            <EvidenceUploader
              onUpload={handleUploadEvidence}
              uploading={evidenceMutation.isPending}
            />
          </Card>

          {/* Notes */}
          <Card title="Notes">
            <div className="mb-4">
              <Textarea
                name="note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleAddNote}
                  disabled={!noteText.trim()}
                  loading={noteMutation.isPending}
                >
                  Add Note
                </Button>
              </div>
            </div>

            <IncidentTimeline notes={incident.notes || []} />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          <Card title="Actions">
            <div className="space-y-2">
              <Button
                variant="primary"
                fullWidth
                icon={UserPlus}
                onClick={() => setAssignOpen(true)}
                disabled={assignMutation.isPending}
              >
                Assign to User
              </Button>
              <Button
                variant="success"
                fullWidth
                icon={CheckCircle}
                onClick={() => setResolveOpen(true)}
                disabled={
                  incident.status === 'resolved' || resolveMutation.isPending
                }
              >
                Mark as Resolved
              </Button>
            </div>
          </Card>

          {/* Resolution (if resolved) */}
          {incident.status === 'resolved' && incident.resolution && (
            <Card title="Resolution">
              <div className="space-y-3 text-sm">
                {incident.resolution.resolutionNotes && (
                  <div>
                    <p className="text-xs text-secondary-500 mb-1">Notes</p>
                    <p className="text-secondary-700 dark:text-secondary-300">
                      {incident.resolution.resolutionNotes}
                    </p>
                  </div>
                )}
                {incident.resolution.actionTaken && (
                  <div>
                    <p className="text-xs text-secondary-500 mb-1">Action Taken</p>
                    <p className="text-secondary-700 dark:text-secondary-300">
                      {incident.resolution.actionTaken}
                    </p>
                  </div>
                )}
                {incident.resolution.resolvedAt && (
                  <div>
                    <p className="text-xs text-secondary-500 mb-1">Resolved</p>
                    <p className="text-secondary-700 dark:text-secondary-300">
                      {formatRelativeTime(incident.resolution.resolvedAt)}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Incident"
        message="Are you sure you want to delete this incident? This action cannot be undone."
        confirmText="Delete"
        loading={deleteMutation.isPending}
      />

      <Modal
        isOpen={resolveOpen}
        onClose={() => setResolveOpen(false)}
        title="Resolve Incident"
        footer={
          <>
            <Button variant="outline" onClick={() => setResolveOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              onClick={handleResolve}
              loading={resolveMutation.isPending}
            >
              Resolve
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Resolution Notes"
            name="resolutionNotes"
            value={resolveNotes}
            onChange={(e) => setResolveNotes(e.target.value)}
            placeholder="What was the outcome?"
            rows={3}
          />
          <Textarea
            label="Action Taken"
            name="actionTaken"
            value={actionTaken}
            onChange={(e) => setActionTaken(e.target.value)}
            placeholder="What actions were taken?"
            rows={2}
          />
        </div>
      </Modal>

      {/* Assign placeholder modal (simplified) */}
      <Modal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign Incident"
        footer={
          <Button variant="outline" onClick={() => setAssignOpen(false)}>
            Close
          </Button>
        }
      >
        <p className="text-sm text-secondary-500">
          Assignment UI will be completed with the Users module. For now, this modal is a placeholder.
        </p>
      </Modal>
    </>
  );
};

export default IncidentDetails;