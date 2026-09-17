import { useState } from 'react';
import PropTypes from 'prop-types';
import { Send } from 'lucide-react';
import { useCreateAlert } from '../../hooks/useAlerts';
import { useForm } from '../../hooks/useForm';
import Modal from '../Common/Modal';
import Button from '../Common/Button';
import Input from '../Common/Input';
import Select from '../Common/Select';
import Textarea from '../Forms/Textarea';
import { ALERT_PRIORITY_OPTIONS } from '../../constants/alertTypes';

const CreateAlertModal = ({ isOpen, onClose }) => {
  const createMutation = useCreateAlert();

  const validate = (values) => {
    const errors = {};
    if (!values.title || values.title.length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }
    if (!values.message || values.message.length < 5) {
      errors.message = 'Message must be at least 5 characters';
    }
    return errors;
  };

  const handleSubmit = async (values) => {
    await createMutation.mutateAsync({
      title: values.title.trim(),
      message: values.message.trim(),
      priority: values.priority,
      type: 'in_app',
      channels: ['in_app', 'socket'],
    });
    form.resetForm();
    onClose();
  };

  const form = useForm(
    {
      title: '',
      message: '',
      priority: 'medium',
    },
    validate,
    handleSubmit
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Alert"
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Send}
            onClick={form.handleSubmit}
            loading={createMutation.isPending}
          >
            Send Alert
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Title"
          name="title"
          value={form.values.title}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errors.title}
          touched={form.touched.title}
          placeholder="Alert title"
          required
          maxLength={200}
        />

        <Textarea
          label="Message"
          name="message"
          value={form.values.message}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errors.message}
          touched={form.touched.message}
          placeholder="Describe the alert..."
          required
          rows={4}
          maxLength={1000}
        />

        <Select
          label="Priority"
          name="priority"
          value={form.values.priority}
          onChange={form.handleChange}
          options={ALERT_PRIORITY_OPTIONS}
          required
        />
      </div>
    </Modal>
  );
};

CreateAlertModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CreateAlertModal;