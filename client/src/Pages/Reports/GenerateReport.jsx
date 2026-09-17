import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCreateReport } from '../../hooks/useReports';
import PageHeader from '../../components/Layout/PageHeader';
import Button from '../../components/Common/Button';
import { GenerateReportForm } from '../../components/Reports';
import { ROUTES } from '../../constants/routes';

const GenerateReport = () => {
  const navigate = useNavigate();
  const createMutation = useCreateReport();

  const handleSubmit = async (payload) => {
    await createMutation.mutateAsync(payload);
    navigate(ROUTES.REPORTS);
  };

  return (
    <>
      <PageHeader
        title="Generate Report"
        subtitle="Create a custom analytical report"
        breadcrumbs={[
          { label: 'Reports', path: ROUTES.REPORTS },
          { label: 'Generate' },
        ]}
        actions={
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate(ROUTES.REPORTS)}
          >
            Back
          </Button>
        }
      />

      <div className="max-w-4xl">
        <GenerateReportForm
          onSubmit={handleSubmit}
          loading={createMutation.isPending}
        />
      </div>
    </>
  );
};

export default GenerateReport;