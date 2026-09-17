import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Building2, Phone, UserPlus } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useForm } from '../../hooks/useForm';
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  validateName,
  validatePhone,
  validateRequired,
} from '../../utils/validation';
import { notificationService } from '../../services/notification.service';
import { ROUTES } from '../../constants/routes';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Select from '../../components/Common/Select';
import Checkbox from '../../components/Common/Checkbox';
import Alert from '../../components/Common/Alert';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [serverError, setServerError] = useState('');

  const roleOptions = [
    { value: ROLES.OPERATOR, label: ROLE_LABELS[ROLES.OPERATOR] },
    { value: ROLES.VIEWER, label: ROLE_LABELS[ROLES.VIEWER] },
  ];

  const validate = (values) => {
    const errors = {};
    const nameError = validateName(values.name);
    const emailError = validateEmail(values.email);
    const passwordError = validatePassword(values.password);
    const confirmError = validateConfirmPassword(values.password, values.confirmPassword);
    const phoneError = validatePhone(values.phoneNumber);

    if (nameError) errors.name = nameError;
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    if (confirmError) errors.confirmPassword = confirmError;
    if (phoneError) errors.phoneNumber = phoneError;
    if (!values.role) errors.role = 'Please select a role';
    if (!acceptTerms) errors.terms = 'You must accept the terms and conditions';

    return errors;
  };

  const handleRegister = async (values) => {
    setServerError('');
    try {
      const payload = {
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        password: values.password,
        role: values.role,
      };

      if (values.organization?.trim()) payload.organization = values.organization.trim();
      if (values.phoneNumber?.trim()) payload.phoneNumber = values.phoneNumber.trim();

      await register(payload);

      notificationService.success('Account created successfully! Welcome aboard.');
      navigate(ROUTES.DASHBOARD, { replace: true });
    } catch (error) {
      const message = error.userMessage || 'Registration failed. Please try again.';
      setServerError(message);
      notificationService.error(message);
    }
  };

  const form = useForm(
    {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: ROLES.OPERATOR,
      organization: '',
      phoneNumber: '',
    },
    validate,
    handleRegister
  );

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-900 dark:text-white mb-2">
          Create your account
        </h1>
        <p className="text-secondary-500 dark:text-secondary-400">
          Join the intelligent security monitoring platform
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

      <form onSubmit={form.handleSubmit} className="space-y-4">
        <Input
          label="Full Name"
          name="name"
          type="text"
          value={form.values.name}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errors.name}
          touched={form.touched.name}
          placeholder="John Doe"
          icon={User}
          required
          autoComplete="name"
        />

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
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Password"
            name="password"
            type="password"
            value={form.values.password}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.password}
            touched={form.touched.password}
            placeholder="Min. 6 characters"
            icon={Lock}
            required
            autoComplete="new-password"
            helperText="Must contain uppercase, lowercase & number"
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={form.values.confirmPassword}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.confirmPassword}
            touched={form.touched.confirmPassword}
            placeholder="Re-enter password"
            icon={Lock}
            required
            autoComplete="new-password"
          />
        </div>

        <Select
          label="Role"
          name="role"
          value={form.values.role}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          options={roleOptions}
          error={form.errors.role}
          touched={form.touched.role}
          required
        />

        <Input
          label="Organization"
          name="organization"
          type="text"
          value={form.values.organization}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          placeholder="Company / Institution (optional)"
          icon={Building2}
          autoComplete="organization"
        />

        <Input
          label="Phone Number"
          name="phoneNumber"
          type="tel"
          value={form.values.phoneNumber}
          onChange={form.handleChange}
          onBlur={form.handleBlur}
          error={form.errors.phoneNumber}
          touched={form.touched.phoneNumber}
          placeholder="+1 234 567 8900 (optional)"
          icon={Phone}
          autoComplete="tel"
        />

        <div className="pt-2">
          <Checkbox
            name="terms"
            checked={acceptTerms}
            onChange={(e) => {
              setAcceptTerms(e.target.checked);
              form.setFieldValue('terms', e.target.checked);
            }}
            label="I agree to the Terms of Service and Privacy Policy"
          />
          {form.errors.terms && form.touched.terms && (
            <p className="mt-1 text-xs text-danger-600 dark:text-danger-400">
              {form.errors.terms}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          fullWidth
          loading={form.isSubmitting}
          icon={UserPlus}
          className="mt-2"
        >
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-secondary-600 dark:text-secondary-400">
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default Register;