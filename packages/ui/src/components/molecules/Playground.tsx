import {
  RequestSection,
  ResponseSection,
  useRequestState,
} from "@freestyle/ui";
import { useState, useCallback } from "react";

export const Playground = () => {
  const [response, setResponse] = useState<string | null>(null);
  const [responseType, setResponseType] = useState<
    "json" | "html" | "text" | null
  >(null);
  const [responseHeader, setResponseHeader] = useState<any>(null);

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
      } else if (contentType?.includes("text/html")) {
        const html = await res.text();
        setResponse(html);
        setResponseType("html");
      } else {
        // fallback to text for other types like text/plain, XML, etc.
        const text = await res.text();
        setResponse(text);
        setResponseType("text");
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
    <>
      <RequestSection
        requestState={requestState}
        onRequestStateChange={onRequestStateChange}
        onMakeRequest={makeRequest}
      />

      <div className="px-4 border-t -mx-4 mt-2">
        <ResponseSection
          response={response}
          responseType={responseType}
          responseHeader={responseHeader}
          isLoading={requestState.isLoading}
        />
      </div>
    </>
  );
};
