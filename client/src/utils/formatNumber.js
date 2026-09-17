export const formatNumber = (num, options = {}) => {
  if (num === null || num === undefined) return '0';
  return new Intl.NumberFormat('en-US', options).format(num);
};

export const formatCompactNumber = (num) => {
  return formatNumber(num, {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
};

export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
};

export const formatCurrency = (value, currency = 'USD') => {
  return formatNumber(value, {
    style: 'currency',
    currency,
  });
};