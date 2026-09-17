import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCreateUser } from '../../hooks/useUsers';
import PageHeader from '../../components/Layout/PageHeader';
import Button from '../../components/Common/Button';
import { UserForm } from '../../components/Users';
import { ROUTES } from '../../constants/routes';

const AddUser = () => {
  const navigate = useNavigate();
  const createMutation = useCreateUser();

  const handleSubmit = async (payload) => {
    await createMutation.mutateAsync(payload);
    navigate(ROUTES.USERS);
  };

  return (
    <>
      <PageHeader
        title="Add User"
        subtitle="Create a new user account"
        breadcrumbs={[
          { label: 'Users', path: ROUTES.USERS },
          { label: 'Add User' },
        ]}
        actions={
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate(ROUTES.USERS)}
          >
            Back
          </Button>
        }
      />

      <div className="max-w-3xl">
        <UserForm onSubmit={handleSubmit} loading={createMutation.isPending} />
      </div>
    </>
  );
};

export default AddUser;