import { VALIDATION_RULES } from '../constants/validation';

export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  if (!VALIDATION_RULES.EMAIL.pattern.test(email)) {
    return VALIDATION_RULES.EMAIL.message;
  }
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < VALIDATION_RULES.PASSWORD.minLength) {
    return `Password must be at least ${VALIDATION_RULES.PASSWORD.minLength} characters`;
  }
  if (!VALIDATION_RULES.PASSWORD.pattern.test(password)) {
    return VALIDATION_RULES.PASSWORD.message;
  }
  return null;
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return null;
};

export const validateName = (name) => {
  if (!name) return 'Name is required';
  if (name.length < VALIDATION_RULES.NAME.minLength) {
    return `Name must be at least ${VALIDATION_RULES.NAME.minLength} characters`;
  }
  if (name.length > VALIDATION_RULES.NAME.maxLength) {
    return `Name cannot exceed ${VALIDATION_RULES.NAME.maxLength} characters`;
  }
  return null;
};

export const validatePhone = (phone) => {
  if (!phone) return null; // Optional field
  if (!VALIDATION_RULES.PHONE.pattern.test(phone)) {
    return VALIDATION_RULES.PHONE.message;
  }
  return null;
};

export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return `${fieldName} is required`;
  }
  return null;
};