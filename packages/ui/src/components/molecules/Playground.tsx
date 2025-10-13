import {
  RequestSection,
  ResponseSection,
  useRequestState,
  ResizableSplit,
} from "@freestyle/ui";
import { useState, useCallback } from "react";

export const Playground = () => {
  const [response, setResponse] = useState<string | null>(null);
  const [responseType, setResponseType] = useState<
    "json" | "html" | "text" | null
  >(null);
  const [responseHeader, setResponseHeader] = useState<any>(null);
  const [requestTime, setRequestTime] = useState<number | undefined>(undefined);
  const [responseSize, setResponseSize] = useState<number | undefined>(
    undefined
  );
  const [statusCode, setStatusCode] = useState<number | undefined>(undefined);
  const [statusText, setStatusText] = useState<string | undefined>(undefined);

  // Use the new request state management
  const {
    state: requestState,
    updateState: onRequestStateChange,
    validation,
  } = useRequestState({
    config: {
      url: "https://jsonplaceholder.typicode.com/posts",
      method: "GET",
      headers: {},
      timeout: 30000,
    },
  });

  const makeRequest = useCallback(async () => {
    onRequestStateChange({ isLoading: true, error: null });

    // Reset metrics
    setRequestTime(undefined);
    setResponseSize(undefined);
    setStatusCode(undefined);
    setStatusText(undefined);

    const startTime = performance.now();

    try {
      // Build headers from the request state
      const headers: Record<string, string> = {};
      requestState.headers
        .filter((h) => h.enabled && h.key.trim())
        .forEach((h) => {
          headers[h.key] = h.value;
        });

      // Build query parameters
      const queryParams = requestState.queryParams
        .filter((p) => p.enabled && p.key.trim())
        .map(
          (p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`
        )
        .join("&");

      const url = queryParams
        ? `${requestState.config.url}?${queryParams}`
        : requestState.config.url;

      // Build request body based on body type
      let body: string | FormData | undefined;
      if (requestState.bodyType === "raw" && requestState.rawContent) {
        body = requestState.rawContent;
      } else if (
        requestState.bodyType === "form-data" &&
        requestState.formData.length > 0
      ) {
        const formData = new FormData();
        requestState.formData
          .filter((f) => f.enabled && f.key.trim())
          .forEach((f) => {
            if (f.type === "File") {
              // Handle file uploads - this would need file input handling
              // For now, just add the value as text
              formData.append(f.key, f.value);
            } else {
              formData.append(f.key, f.value);
            }
          });
        body = formData;
      } else if (
        requestState.bodyType === "x-www-form-urlencoded" &&
        requestState.formData.length > 0
      ) {
        const formData = requestState.formData
          .filter((f) => f.enabled && f.key.trim())
          .map(
            (f) => `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`
          )
          .join("&");
        body = formData;
        headers["Content-Type"] = "application/x-www-form-urlencoded";
      }

      const res = await fetch(url, {
        method: requestState.config.method,
        headers,
        body,
      });

      // Capture request timing
      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);
      setRequestTime(duration);

      // Capture status code and text
      setStatusCode(res.status);
      setStatusText(res.statusText);

      const contentType = res.headers.get("content-type");

      // Convert Headers object to a plain object
      const headersObj: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        headersObj[key] = value;
      });
      setResponseHeader(headersObj);

      if (contentType?.includes("application/json")) {
        const data = await res.json();
        setResponse(data);
        setResponseType("json");
        // Calculate response size for JSON
        setResponseSize(new Blob([JSON.stringify(data)]).size);
      } else if (contentType?.includes("text/html")) {
        const html = await res.text();
        setResponse(html);
        setResponseType("html");
        // Calculate response size for HTML
        setResponseSize(new Blob([html]).size);
      } else {
        // fallback to text for other types like text/plain, XML, etc.
        const text = await res.text();
        setResponse(text);
        setResponseType("text");
        // Calculate response size for text
        setResponseSize(new Blob([text]).size);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Request failed";
      onRequestStateChange({ error: errorMessage });
      setResponse(`Error: ${errorMessage}`);
    } finally {
      onRequestStateChange({ isLoading: false });
    }
  }, [requestState, onRequestStateChange]);

  return (
    <ResizableSplit
      initialSplit={50}
      minSize={150}
      className="h-full"
      splitterClassName="border-t border-b"
    >
      {/* Request Panel */}
      <div className="h-full overflow-auto">
        <RequestSection
          requestState={requestState}
          onRequestStateChange={onRequestStateChange}
          onMakeRequest={makeRequest}
        />
      </div>

      {/* Response Panel */}
      <div className="h-full overflow-auto">
        <div className="px-4 border-t -mx-4">
          <ResponseSection
            response={response}
            responseType={responseType}
            responseHeader={responseHeader}
            isLoading={requestState.isLoading}
            requestTime={requestTime}
            responseSize={responseSize}
            statusCode={statusCode}
            statusText={statusText}
          />
        </div>
      </div>
    </ResizableSplit>
  );
};
