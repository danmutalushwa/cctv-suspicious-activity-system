import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import { validateEmail, validateRequired } from '../../utils/validation';
import { notificationService } from '../../services/notification.service';
import { ROUTES } from '../../constants/routes';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Checkbox from '../../components/Common/Checkbox';
import Alert from '../../components/Common/Alert';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = (values) => {
    const errors = {};
    const emailError = validateEmail(values.email);
    const passwordError = validateRequired(values.password, 'Password');
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    return errors;
  };

  const handleLogin = async (values) => {
    setServerError('');
    try {
      await login({
        email: values.email.trim().toLowerCase(),
        password: values.password,
      });

      notificationService.success('Login successful! Welcome back.');

      const from = location.state?.from?.pathname || ROUTES.DASHBOARD;
      navigate(from, { replace: true });
    } catch (error) {
      const message = error.userMessage || 'Login failed. Please try again.';
      setServerError(message);
      notificationService.error(message);
    }
  };

  const form = useForm(
    { email: '', password: '' },
    validate,
    handleLogin
  );

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
          Welcome back
        </h1>
        <p className="text-secondary-500 dark:text-secondary-400">
          Sign in to access your security dashboard
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

        <Input
          label="Password"
          name="password"
          type="password"
          value={form.values.password}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errors.password}
          touched={form.touched.password}
          placeholder="Enter your password"
          icon={Lock}
          required
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between">
          <Checkbox
            label="Remember me"
            name="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={form.isSubmitting}
          icon={LogIn}
        >
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-secondary-600 dark:text-secondary-400">
        Don&apos;t have an account?{' '}
        <Link
          to={ROUTES.REGISTER}
          className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          Create one now
        </Link>
      </p>
    </div>
  );
};

export default Login;