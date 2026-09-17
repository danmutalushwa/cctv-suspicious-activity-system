import { useState, useCallback } from 'react';

export const useForm = (initialValues = {}, validate = null, onSubmit = null) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked, files } = e.target;
      const val = type === 'checkbox' ? checked : type === 'file' ? files : value;

      setValues((prev) => ({ ...prev, [name]: val }));
      setTouched((prev) => ({ ...prev, [name]: true }));

      if (validate) {
        const validationErrors = validate({ ...values, [name]: val });
        setErrors(validationErrors);
      }
    },
    [values, validate]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));

      if (validate) {
        const validationErrors = validate(values);
        setErrors(validationErrors);
      }
    },
    [values, validate]
  );

  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      if (e) e.preventDefault();

      if (validate) {
        const validationErrors = validate(values);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
          return;
        }
      }

      setIsSubmitting(true);
      try {
        if (onSubmit) await onSubmit(values);
      } catch (error) {
        console.error('Form submission error:', error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, validate, onSubmit]
  );

  const resetForm = useCallback(
    (newValues = initialValues) => {
      setValues(newValues);
      setErrors({});
      setTouched({});
      setIsSubmitting(false);
    },
    [initialValues]
  );

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setValues,
    resetForm,
  };
};