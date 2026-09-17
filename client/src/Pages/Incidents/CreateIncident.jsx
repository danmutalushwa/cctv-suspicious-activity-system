import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { useCreateIncident } from '../../hooks/useIncidents';
import { useForm } from '../../hooks/useForm';
import PageHeader from '../../components/Layout/PageHeader';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Select from '../../components/Common/Select';
import Textarea from '../../components/Forms/Textarea';
import { INCIDENT_TYPE_OPTIONS } from '../../constants/incidentTypes';
import { SEVERITY_OPTIONS } from '../../constants/status';
import { ROUTES } from '../../constants/routes';
import { validateRequired } from '../../utils/validation';

const CreateIncident = () => {
  const navigate = useNavigate();
  const createMutation = useCreateIncident();

  const validate = (values) => {
    const errors = {};
    if (!values.title || values.title.length < 5) {
      errors.title = 'Title must be at least 5 characters';
    }
    if (!values.description || values.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }
    if (!values.type) errors.type = 'Type is required';
    if (!values.severity) errors.severity = 'Severity is required';
    return errors;
  };

  const handleSubmit = async (values) => {
    const payload = {
      title: values.title.trim(),
      description: values.description.trim(),
      type: values.type,
      severity: values.severity,
      location: {},
    };

    if (values.address) payload.location.address = values.address.trim();
    if (values.coordinates) {
      const [lng, lat] = values.coordinates.split(',').map((v) => parseFloat(v.trim()));
      if (!isNaN(lng) && !isNaN(lat)) payload.location.coordinates = [lng, lat];
    }

    await createMutation.mutateAsync(payload);
    navigate(ROUTES.INCIDENTS);
  };

  const form = useForm(
    {
      title: '',
      description: '',
      type: '',
      severity: 'medium',
      address: '',
      coordinates: '',
    },
    validate,
    handleSubmit
  );

  return (
    <>
      <PageHeader
        title="Create Incident"
        subtitle="Report a new security incident"
        breadcrumbs={[
          { label: 'Incidents', path: ROUTES.INCIDENTS },
          { label: 'Create' },
        ]}
        actions={
          <Button
            variant="outline"
            icon={ArrowLeft}
            onClick={() => navigate(ROUTES.INCIDENTS)}
          >
            Cancel
          </Button>
        }
      />

      <form onSubmit={form.handleSubmit} className="max-w-3xl space-y-6">
        <Card title="Incident Details">
          <div className="space-y-4">
            <Input
              label="Title"
              name="title"
              value={form.values.title}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.errors.title}
              touched={form.touched.title}
              placeholder="Brief summary of the incident"
              required
              maxLength={200}
            />

            <Textarea
              label="Description"
              name="description"
              value={form.values.description}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              error={form.errors.description}
              touched={form.touched.description}
              placeholder="Detailed description of what happened..."
              required
              rows={5}
              maxLength={2000}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Type"
                name="type"
                value={form.values.type}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                options={INCIDENT_TYPE_OPTIONS}
                error={form.errors.type}
                touched={form.touched.type}
                placeholder="Select type"
                required
              />

              <Select
                label="Severity"
                name="severity"
                value={form.values.severity}
                onChange={form.handleChange}
                onBlur={form.handleBlur}
                options={SEVERITY_OPTIONS}
                error={form.errors.severity}
                touched={form.touched.severity}
                required
              />
            </div>
          </div>
        </Card>

        <Card title="Location">
          <div className="space-y-4">
            <Input
              label="Address"
              name="address"
              value={form.values.address}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="Where did this occur?"
            />

            <Input
              label="Coordinates"
              name="coordinates"
              value={form.values.coordinates}
              onChange={form.handleChange}
              onBlur={form.handleBlur}
              placeholder="longitude, latitude (e.g., 77.5946, 12.9716)"
              helperText="Optional: Enter GPS coordinates for map view"
            />
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(ROUTES.INCIDENTS)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            icon={Save}
            loading={createMutation.isPending}
          >
            Create Incident
          </Button>
        </div>
      </form>
    </>
  );
};

export default CreateIncident;