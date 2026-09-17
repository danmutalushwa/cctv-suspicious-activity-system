import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { authAPI } from '../../api/auth';
import { useForm } from '../../hooks/useForm';
import { validateEmail } from '../../utils/validation';
import { notificationService } from '../../services/notification.service';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Alert from '../../components/Common/Alert';

const ForgotPassword = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [serverError, setServerError] = useState('');

  const validate = (values) => {
    const errors = {};
    const emailError = validateEmail(values.email);
    if (emailError) errors.email = emailError;
    return errors;
  };

  const handleSubmit = async (values) => {
    setServerError('');
    try {
      await authAPI.forgotPassword(values.email.trim().toLowerCase());
      setSubmittedEmail(values.email);
      setIsSubmitted(true);
      notificationService.success('Password reset link sent to your email');
    } catch (error) {
      const message = error.userMessage || 'Failed to send reset link. Please try again.';
      setServerError(message);
      notificationService.error(message);
    }
  };

  const form = useForm({ email: '' }, validate, handleSubmit);

  if (isSubmitted) {
    return (
      <div className="w-full">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-success-100 dark:bg-success-900/30 rounded-full flex items-center justify-center mb-6">
            <Mail className="w-8 h-8 text-success-600 dark:text-success-400" />
          </div>
          <h1 className="text-2xl font-bold text-secondary-900 dark:text-white mb-2">
            Check your email
          </h1>
          <p className="text-secondary-500 dark:text-secondary-400 mb-6">
            We&apos;ve sent a password reset link to
            <br />
            <span className="font-medium text-secondary-700 dark:text-secondary-300">
              {submittedEmail}
            </span>
          </p>
          <Alert
            type="info"
            message="Didn't receive the email? Check your spam folder or try again in a few minutes."
            className="text-left mb-6"
          />
          <Link to={ROUTES.LOGIN}>
            <Button variant="outline" fullWidth icon={ArrowLeft}>
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Link
        to={ROUTES.LOGIN}
        className="inline-flex items-center gap-2 text-sm text-secondary-600 dark:text-secondary-400 hover:text-primary-600 mb-6"
      >
        <ArrowLeft size={16} />
        Back to login
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
          Forgot password?
        </h1>
        <p className="text-secondary-500 dark:text-secondary-400">
          No worries, we&apos;ll send you reset instructions.
        </p>
      </div>

      {serverError && (
        <Alert
          type="danger"
          message={serverError}
          className="mb-6"
          onClose={() => setServerError('')}
        />
      )}

      <form onSubmit={form.handleSubmit} className="space-y-5">
        <Input
          label="Email Address"
          name="email"
          type="email"
          value={form.values.email}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errors.email}
          touched={form.touched.email}
          placeholder="you@example.com"
          icon={Mail}
          required
          autoComplete="email"
          autoFocus
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={form.isSubmitting}
          icon={Send}
        >
          Send Reset Link
        </Button>
      </form>
    </div>
  );
};

export default ForgotPassword;