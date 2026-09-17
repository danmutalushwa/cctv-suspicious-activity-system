import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  useAlert,
  useMarkAlertAsRead,
  useAcknowledgeAlert,
} from '../../hooks/useAlerts';
import PageHeader from '../../components/Layout/PageHeader';
import Button from '../../components/Common/Button';
import LoadingScreen from '../../components/Common/LoadingScreen';
import AlertComponent from '../../components/Common/Alert';
import { AlertDetails as AlertDetailsComponent } from '../../components/Alerts';
import { ROUTES } from '../../constants/routes';

const AlertDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useAlert(id);
  const markAsReadMutation = useMarkAlertAsRead();
  const acknowledgeMutation = useAcknowledgeAlert();

  const alert = data?.data?.alert;

  if (isLoading) return <LoadingScreen message="Loading alert..." />;

  if (isError || !alert) {
    return (
      <AlertComponent
        type="danger"
        title="Alert not found"
        message={error?.userMessage || 'The requested alert could not be loaded.'}
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Alert Details"
        breadcrumbs={[
          { label: 'Alerts', path: ROUTES.ALERTS },
          { label: 'Details' },
        ]}
        actions={
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate(ROUTES.ALERTS)}
          >
            Back to Alerts
          </Button>
        }
      />

      <AlertDetailsComponent
        alert={alert}
        onMarkAsRead={(id) => markAsReadMutation.mutate(id)}
        onAcknowledge={(id) => acknowledgeMutation.mutate(id)}
        loading={markAsReadMutation.isPending || acknowledgeMutation.isPending}
      />
    </>
  );
};

export default AlertDetailsPage;