import { useState } from 'react';
import PropTypes from 'prop-types';
import { Save, Wifi, Camera as CameraIcon, MapPin } from 'lucide-react';
import Card from '../Common/Card';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
import Checkbox from '../Common/Checkbox';
import { CAMERA_RESOLUTIONS, CAMERA_FRAMERATES, CAMERA_STATUS_OPTIONS } from '../../constants/cameraStatus';

const CameraForm = ({ initialData = null, onSubmit, loading = false, isEdit = false }) => {
  const [values, setValues] = useState({
    name: initialData?.name || '',
    location: initialData?.location || '',
    ipAddress: initialData?.ipAddress || '',
    rtspUrl: initialData?.rtspUrl || '',
    resolution: initialData?.resolution || '1920x1080',
    frameRate: initialData?.frameRate || 30,
    status: initialData?.status || 'offline',
    isActive: initialData?.isActive ?? true,
    assignedTo: initialData?.assignedTo?._id || '',
  });

  const [errors, setErrors] = useState({});

  const validate = (data) => {
    const errs = {};
    if (!data.name || data.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }
    if (!data.location || data.location.trim().length < 2) {
      errs.location = 'Location is required';
    }
    if (!data.ipAddress) {
      errs.ipAddress = 'IP address is required';
    } else if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(data.ipAddress)) {
      errs.ipAddress = 'Invalid IP address format';
    }
    if (!data.rtspUrl) {
      errs.rtspUrl = 'RTSP URL is required';
    } else if (!data.rtspUrl.startsWith('rtsp://')) {
      errs.rtspUrl = 'URL must start with rtsp://';
    }
    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValues = { ...values, [name]: type === 'checkbox' ? checked : value };
    setValues(newValues);
    setErrors(validate(newValues));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate(values);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const payload = {
      name: values.name.trim(),
      location: values.location.trim(),
      ipAddress: values.ipAddress.trim(),
      rtspUrl: values.rtspUrl.trim(),
      resolution: values.resolution,
      frameRate: parseInt(values.frameRate),
      status: values.status,
      isActive: values.isActive,
    };

    if (values.assignedTo) payload.assignedTo = values.assignedTo;

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Basic Information">
        <div className="space-y-4">
          <Input
            label="Camera Name"
            name="name"
            value={values.name}
            onChange={handleChange}
            error={errors.name}
            touched={!!errors.name}
            placeholder="e.g., Main Entrance Camera"
            icon={CameraIcon}
            required
          />

          <Input
            label="Location"
            name="location"
            value={values.location}
            onChange={handleChange}
            error={errors.location}
            touched={!!errors.location}
            placeholder="e.g., Building A, Floor 1"
            icon={MapPin}
            required
          />
        </div>
      </Card>

      <Card title="Connection">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="IP Address"
              name="ipAddress"
              value={values.ipAddress}
              onChange={handleChange}
              error={errors.ipAddress}
              touched={!!errors.ipAddress}
              placeholder="192.168.1.100"
              icon={Wifi}
              required
            />
            <Select
              label="Status"
              name="status"
              value={values.status}
              onChange={handleChange}
              options={CAMERA_STATUS_OPTIONS}
            />
          </div>

          <Input
            label="RTSP Stream URL"
            name="rtspUrl"
            value={values.rtspUrl}
            onChange={handleChange}
            error={errors.rtspUrl}
            touched={!!errors.rtspUrl}
            placeholder="rtsp://admin:password@192.168.1.100:554/stream"
            helperText="Format: rtsp://[user]:[pass]@[ip]:[port]/[path]"
            required
          />
        </div>
      </Card>

      <Card title="Video Settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Resolution"
            name="resolution"
            value={values.resolution}
            onChange={handleChange}
            options={CAMERA_RESOLUTIONS}
          />
          <Select
            label="Frame Rate (fps)"
            name="frameRate"
            value={values.frameRate}
            onChange={handleChange}
            options={CAMERA_FRAMERATES.map((f) => ({ value: f, label: `${f} fps` }))}
          />
        </div>
      </Card>

      <Card title="Status">
        <Checkbox
          name="isActive"
          label="Camera is enabled"
          checked={values.isActive}
          onChange={handleChange}
        />
      </Card>

      <div className="flex items-center justify-end gap-3">
        <Button type="submit" variant="primary" icon={Save} loading={loading}>
          {isEdit ? 'Update Camera' : 'Add Camera'}
        </Button>
      </div>
    </form>
  );
};

CameraForm.propTypes = {
  initialData: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  isEdit: PropTypes.bool,
};

export default CameraForm;