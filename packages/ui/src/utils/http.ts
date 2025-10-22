/**
 * HTTP status code to status text mapping
 */
const HTTP_STATUS_TEXTS: Record<number, string> = {
  100: "Continue",
  101: "Switching Protocols",
  200: "OK",
  201: "Created",
  202: "Accepted",
  204: "No Content",
  301: "Moved Permanently",
  302: "Found",
  304: "Not Modified",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  413: "Payload Too Large",
  414: "URI Too Long",
  415: "Unsupported Media Type",
  429: "Too Many Requests",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
};

/**
 * Get the appropriate color class for a status code
 */
export const getStatusColor = (code: number): string => {
  if (code >= 200 && code < 300) return "text-green-600";
  if (code >= 300 && code < 400) return "text-blue-600";
  if (code >= 400 && code < 500) return "text-yellow-600";
  if (code >= 500) return "text-red-600";
  return "text-gray-600";
};

/**
 * Get status text for a given status code
 * @param code - HTTP status code
 * @param providedText - Status text provided by the server (optional)
 * @returns The appropriate status text
 */
export const getStatusText = (code: number, providedText?: string): string => {
  if (providedText) return providedText;
  return HTTP_STATUS_TEXTS[code] || "Unknown";
};

/**
 * Format request time in a human-readable format
 * @param time - Time in milliseconds
 * @returns Formatted time string (e.g., "150ms", "1.2s")
 */
export const formatRequestTime = (time: number): string => {
  if (time < 1000) {
    return `${time} ms`;
  }
  return `${(time / 1000).toFixed(2)} s`;
};

/**
 * Format response size in a human-readable format
 * @param size - Size in bytes
 * @returns Formatted size string (e.g., "1.5 KB", "2.3 MB")
 */
export const formatResponseSize = (size: number): string => {
  if (size < 1024) {
    return `${size} B`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
};
