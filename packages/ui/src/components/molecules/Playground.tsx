import {
  RequestSection,
  ResponseSection,
  useRequestState,
  ResizableSplit,
} from "@freestyle/ui";
import { useState, useCallback } from "react";
import { FolderSelectionDialog } from "./FolderSelectionDialog";
import { Toaster } from "../ui/sonner";
import { databaseService } from "../../lib/database";
import { toast } from "sonner";

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
  const [showFolderDialog, setShowFolderDialog] = useState(false);

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

  const handleSaveRequest = useCallback(async () => {
    try {
      // Validate request state
      if (!requestState.config.url || !requestState.config.method) {
        toast.error("Invalid request", {
          description: "Please provide a valid URL and method",
        });
        return;
      }

      // Check if we have a saved folder preference
      const savedFolderId = localStorage.getItem("requestSaveFolder");

      if (savedFolderId) {
        // Use saved folder
        await saveRequestToFolder(savedFolderId);
      } else {
        // Show folder selection dialog
        setShowFolderDialog(true);
      }
    } catch (err) {
      console.error("Save request error:", err);
      toast.error("Failed to save request", {
        description: "An error occurred while saving the request",
      });
    }
  }, [requestState]);

  const saveRequestToFolder = useCallback(
    async (folderId: string | null) => {
      try {
        // Build headers object
        const headers: Record<string, string> = {};
        requestState.headers
          .filter((h) => h.enabled && h.key.trim())
          .forEach((h) => {
            headers[h.key] = h.value;
          });

        // Build request body
        let body: string | null = null;
        if (requestState.bodyType === "raw" && requestState.rawContent) {
          body = requestState.rawContent;
        } else if (
          requestState.bodyType === "form-data" &&
          requestState.formData.length > 0
        ) {
          const formData = requestState.formData
            .filter((f) => f.enabled && f.key.trim())
            .map((f) => `${f.key}=${f.value}`)
            .join("&");
          body = formData;
        } else if (
          requestState.bodyType === "x-www-form-urlencoded" &&
          requestState.formData.length > 0
        ) {
          const formData = requestState.formData
            .filter((f) => f.enabled && f.key.trim())
            .map(
              (f) =>
                `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`
            )
            .join("&");
          body = formData;
        }

        // Generate request name from URL
        let requestName = `${requestState.config.method.toUpperCase()} Request`;
        try {
          if (requestState.config.url) {
            const url = new URL(requestState.config.url);
            requestName = `${requestState.config.method.toUpperCase()} ${url.pathname}`;
          }
        } catch (error) {
          // If URL is invalid, use a fallback name
          requestName = `${requestState.config.method.toUpperCase()} ${requestState.config.url || "Request"}`;
        }

        await databaseService.saveRequest({
          name: requestName,
          folderId,
          method: requestState.config.method,
          url: requestState.config.url,
          headers,
          body,
        });

        const folderName = folderId ? "selected folder" : "Root";
        toast.success("Request saved successfully", {
          description: `Saved to ${folderName}`,
        });
      } catch (err) {
        console.error("Save request to folder error:", err);
        toast.error("Failed to save request", {
          description: "An error occurred while saving the request",
        });
      }
    },
    [requestState]
  );

  const handleFolderSelect = useCallback(
    async (folderId: string | null, folderName: string) => {
      // Save folder preference to localStorage
      if (folderId) {
        localStorage.setItem("requestSaveFolder", folderId);
      } else {
        localStorage.removeItem("requestSaveFolder");
      }

      await saveRequestToFolder(folderId);
      setShowFolderDialog(false);
    },
    [saveRequestToFolder]
  );

  return (
    <>
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
            onSaveRequest={handleSaveRequest}
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

      {/* Folder Selection Dialog */}
      <FolderSelectionDialog
        isOpen={showFolderDialog}
        onClose={() => setShowFolderDialog(false)}
        onSelect={handleFolderSelect}
      />

      {/* Sonner Toaster */}
      <Toaster />
    </>
  );
};
