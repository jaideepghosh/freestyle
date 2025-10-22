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
    return `${time}ms`;
  }
  return `${(time / 1000).toFixed(2)}s`;
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

/**
 * Interface for proxy request options
 */
export interface ProxyRequestOptions {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  proxyService?: CORSProxyService;
}

/**
 * Interface for proxy response
 */
export interface ProxyResponse {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  url: string;
}

/**
 * Available CORS proxy services
 */
export enum CORSProxyService {
  CORS_ANYWHERE = "cors-anywhere",
  ALL_ORIGINS = "all-origins",
  CORS_PROXY = "cors-proxy",
  DIRECT = "direct",
}

/**
 * CORS proxy service configurations
 */
const PROXY_SERVICES = {
  [CORSProxyService.CORS_ANYWHERE]: {
    baseUrl: "https://cors-anywhere.herokuapp.com/",
    requiresAuth: true,
    description: "CORS Anywhere (requires request header)",
  },
  [CORSProxyService.ALL_ORIGINS]: {
    baseUrl: "https://api.allorigins.win/raw?url=",
    requiresAuth: false,
    description: "AllOrigins (free, reliable)",
  },
  [CORSProxyService.CORS_PROXY]: {
    baseUrl: "https://corsproxy.io/?",
    requiresAuth: false,
    description: "CORS Proxy (free, fast)",
  },
  [CORSProxyService.DIRECT]: {
    baseUrl: "",
    requiresAuth: false,
    description: "Direct (may fail with CORS)",
  },
};

/**
 * Make an HTTP request with CORS bypass using public proxy services
 * @param options - Request options
 * @returns Promise with the response data
 */
export const makeProxyRequest = async (
  options: ProxyRequestOptions
): Promise<ProxyResponse> => {
  const {
    url,
    method,
    headers = {},
    body,
    timeout = 30000,
    proxyService = CORSProxyService.ALL_ORIGINS,
  } = options;

  // Try direct request first if it's same-origin
  if (proxyService === CORSProxyService.DIRECT || !isCrossOrigin(url)) {
    return makeDirectRequest(url, method, headers, body, timeout);
  }

  // Try different proxy services in order of preference
  const servicesToTry = [
    proxyService,
    CORSProxyService.ALL_ORIGINS,
    CORSProxyService.CORS_PROXY,
    CORSProxyService.CORS_ANYWHERE,
  ];

  for (const service of servicesToTry) {
    try {
      return await makeRequestWithProxy(
        url,
        method,
        headers,
        body,
        timeout,
        service
      );
    } catch (error) {
      console.warn(`Proxy service ${service} failed:`, error);
      // Continue to next service
    }
  }

  throw new Error(
    "All CORS proxy services failed. Please try a different URL or check your internet connection."
  );
};

/**
 * Make a direct request (for same-origin URLs)
 */
const makeDirectRequest = async (
  url: string,
  method: string,
  headers: Record<string, string>,
  body: any,
  timeout: number
): Promise<ProxyResponse> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const contentType = response.headers.get("content-type") || "";
    let responseData: any;

    if (contentType.includes("application/json")) {
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }
    } else {
      responseData = await response.text();
    }

    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      url: response.url,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Make a request using a specific proxy service
 */
const makeRequestWithProxy = async (
  url: string,
  method: string,
  headers: Record<string, string>,
  body: any,
  timeout: number,
  service: CORSProxyService
): Promise<ProxyResponse> => {
  const proxyConfig = PROXY_SERVICES[service];
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    let proxyUrl: string;
    let requestOptions: RequestInit;

    switch (service) {
      case CORSProxyService.ALL_ORIGINS:
        proxyUrl = `${proxyConfig.baseUrl}${encodeURIComponent(url)}`;
        requestOptions = {
          method: "GET", // AllOrigins only supports GET
          signal: controller.signal,
        };
        break;

      case CORSProxyService.CORS_PROXY:
        proxyUrl = `${proxyConfig.baseUrl}${encodeURIComponent(url)}`;
        requestOptions = {
          method,
          headers: {
            ...headers,
            "X-Requested-With": "XMLHttpRequest",
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        };
        break;

      case CORSProxyService.CORS_ANYWHERE:
        proxyUrl = `${proxyConfig.baseUrl}${url}`;
        requestOptions = {
          method,
          headers: {
            ...headers,
            "X-Requested-With": "XMLHttpRequest",
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal,
        };
        break;

      default:
        throw new Error(`Unsupported proxy service: ${service}`);
    }

    const response = await fetch(proxyUrl, requestOptions);
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(
        `Proxy request failed: ${response.status} ${response.statusText}`
      );
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const contentType = response.headers.get("content-type") || "";
    let responseData: any;

    if (contentType.includes("application/json")) {
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }
    } else {
      responseData = await response.text();
    }

    return {
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      url: response.url,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Check if a URL is likely to have CORS issues
 * @param url - The URL to check
 * @returns true if the URL is from a different origin
 */
export const isCrossOrigin = (url: string): boolean => {
  try {
    const urlObj = new URL(url);

    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      const currentOrigin = window.location.origin;
      return urlObj.origin !== currentOrigin;
    }

    // For server-side, assume all external URLs are cross-origin
    // This is a safe assumption since server-side doesn't have CORS restrictions
    return true;
  } catch {
    return false;
  }
};
