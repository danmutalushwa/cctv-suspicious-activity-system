export const VALIDATION_RULES = {
  EMAIL: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  PASSWORD: {
    minLength: 6,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    message: 'Password must be at least 6 characters with uppercase, lowercase, and number',
  },
  PHONE: {
    pattern: /^\+?[\d\s-]{10,}$/,
    message: 'Please enter a valid phone number',
  },
  NAME: {
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    message: 'Name must be 2-50 characters, letters only',
  },
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  PAGE_SIZES: [10, 25, 50, 100],
};