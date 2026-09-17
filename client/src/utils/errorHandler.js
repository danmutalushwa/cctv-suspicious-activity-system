export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred';

  // Axios error with response
  if (error.response) {
    const { data, status } = error.response;

    if (data?.message) return data.message;
    if (data?.error) return data.error;

    switch (status) {
      case 400: return 'Invalid request. Please check your input.';
      case 401: return 'You are not authorized. Please log in again.';
      case 403: return 'You do not have permission to perform this action.';
      case 404: return 'The requested resource was not found.';
      case 409: return 'A conflict occurred. Please try again.';
      case 422: return 'Validation failed. Please check your input.';
      case 429: return 'Too many requests. Please try again later.';
      case 500: return 'Server error. Please try again later.';
      default: return `Request failed with status ${status}`;
    }
  }

  // Axios request error
  if (error.request) {
    return 'No response from server. Please check your connection.';
  }

  // Other errors
  return error.message || 'An unexpected error occurred';
};

export const getFieldErrors = (error) => {
  if (!error?.response?.data?.errors) return {};
  return error.response.data.errors;
};

export const isNetworkError = (error) => {
  return error?.code === 'ERR_NETWORK' || (!error?.response && error?.request);
};

export const isAuthError = (error) => {
  return error?.response?.status === 401;
};