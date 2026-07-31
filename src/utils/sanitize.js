const sanitizeInput = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/<[^>]*>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/[<>]/g, '');
};

export default sanitizeInput;
