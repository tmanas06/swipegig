// src/utils/format.ts
export const formatNumber = (num: number, decimals = 4): string => {
    if (isNaN(num)) return '0';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals,
    }).format(num);
  };