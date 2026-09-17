import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCreateCamera } from '../../hooks/useCameras';
import PageHeader from '../../components/Layout/PageHeader';
import Button from '../../components/Common/Button';
import { CameraForm } from '../../components/Cameras';
import { ROUTES } from '../../constants/routes';

const AddCamera = () => {
  const navigate = useNavigate();
  const createMutation = useCreateCamera();

  const handleSubmit = async (payload) => {
    await createMutation.mutateAsync(payload);
    navigate(ROUTES.CAMERAS);
  };

  return (
    <>
      <PageHeader
        title="Add Camera"
        subtitle="Register a new CCTV camera"
        breadcrumbs={[
          { label: 'Cameras', path: ROUTES.CAMERAS },
          { label: 'Add Camera' },
        ]}
        actions={
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate(ROUTES.CAMERAS)}
          >
            Back
          </Button>
        }
      />

      <div className="max-w-3xl">
        <CameraForm onSubmit={handleSubmit} loading={createMutation.isPending} />
      </div>
    </>
  );
};

export default AddCamera;