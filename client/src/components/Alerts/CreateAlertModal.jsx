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

    if (!values.title || values.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    if (!values.message || values.message.trim().length < 5) {
      errors.message = 'Message must be at least 5 characters';
    }

    if (!values.priority) {
      errors.priority = 'Please select a priority';
    }

    return errors;
  };

  const handleSubmit = async (values) => {
    try {
      await createMutation.mutateAsync({
        title: values.title.trim(),
        message: values.message.trim(),
        priority: values.priority,

        // General in-app alert
        type: 'in_app',

        // Deliver through the application's
        // in-app notification and Socket.IO system
        channels: ['in_app', 'socket'],
      });

      // Reset the form after successful creation
      form.resetForm();

      // Close the modal
      onClose();
    } catch (error) {
      // The mutation hook handles the error state.
      // Keep the modal open so the user can see/retry.
      console.error('Failed to create alert:', error);
    }
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
          <Button
            variant="outline"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
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
        {/* =====================================================
            TITLE
        ====================================================== */}
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

        {/* =====================================================
            MESSAGE
        ====================================================== */}
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

        {/* =====================================================
            PRIORITY
        ====================================================== */}
        <Select
          label="Priority"
          name="priority"
          value={form.values.priority}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errors.priority}
          touched={form.touched.priority}
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