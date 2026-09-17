import PropTypes from 'prop-types';
import { AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import Button from './Button';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      showCloseButton={false}
      closeOnBackdrop={!loading}
    >
      <div className="text-center py-4">
        <div
          className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
            variant === 'danger'
              ? 'bg-danger-100 dark:bg-danger-900/30'
              : 'bg-warning-100 dark:bg-warning-900/30'
          }`}
        >
          <AlertTriangle
            className={
              variant === 'danger'
                ? 'text-danger-600 dark:text-danger-400'
                : 'text-warning-600 dark:text-warning-400'
            }
            size={24}
          />
        </div>
        <h3 className="text-lg font-semibold text-secondary-900 dark:text-white mb-2">
          {title}
        </h3>
        <p className="text-sm text-secondary-500 dark:text-secondary-400 mb-6">
          {message}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

ConfirmDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  variant: PropTypes.oneOf(['danger', 'warning', 'primary']),
  loading: PropTypes.bool,
};

export default ConfirmDialog;