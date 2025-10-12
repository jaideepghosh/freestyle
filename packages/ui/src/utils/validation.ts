import {
  RequestConfig,
  ValidationError,
  RequestValidation,
} from "../types/api";

export const validateUrl = (url: string): ValidationError | null => {
  if (!url.trim()) {
    return { field: "url", message: "URL is required" };
  }

  try {
    new URL(url);
    return null;
  } catch {
    return { field: "url", message: "Please enter a valid URL" };
  }
};

export const validateHeaders = (
  headers: Record<string, string>
): ValidationError[] => {
  const errors: ValidationError[] = [];

  Object.entries(headers).forEach(([key, value]) => {
    if (key.trim() && !value.trim()) {
      errors.push({
        field: `header-${key}`,
        message: "Header value is required when key is provided",
      });
    }
  });

  return errors;
};

export const validateRequest = (config: RequestConfig): RequestValidation => {
  const errors: ValidationError[] = [];

  // Validate URL
  const urlError = validateUrl(config.url);
  if (urlError) {
    errors.push(urlError);
  }

  // Validate headers
  const headerErrors = validateHeaders(config.headers);
  errors.push(...headerErrors);

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, "");
};

export const isValidJson = (jsonString: string): boolean => {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
};

export const formatJson = (jsonString: string): string => {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return jsonString;
  }
};
