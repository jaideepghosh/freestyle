"use client";

import {
  RequestSection,
  ResponseSection,
  useRequestState,
  ResizableSplit,
  Request,
} from "@freestyle/ui";
import React, { useState, useCallback } from "react";
import { SaveRequestDialog } from "./SaveRequestDialog";
import { Toaster } from "../ui/sonner";
import { databaseService } from "../../lib/database";
import { toast } from "sonner";

interface PlaygroundProps {
  onCollectionSaved?: () => void;
  initialRequest?: Request;
}

export const Playground = ({
  onCollectionSaved,
  initialRequest,
}: PlaygroundProps = {}) => {
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
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Track if this is an existing saved request
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(
    initialRequest?.id || null
  );

  // Reset current request ID when initialRequest changes (new request loaded)
  React.useEffect(() => {
    setCurrentRequestId(initialRequest?.id || null);
  }, [initialRequest?.id]);

  // Function to convert Request to RequestState format
  const convertRequestToState = (request: Request) => {
    let headers: any[] = [];
    let queryParams: any[] = [];

    try {
      const parsedHeaders = JSON.parse(request.headers || "{}");
      headers = Object.entries(parsedHeaders).map(([key, value], index) => ({
        id: `header-${Date.now()}-${index}`,
        key,
        value: value as string,
        description: "",
        enabled: true,
      }));
    } catch (error) {
      console.error("Failed to parse headers:", error);
    }

    try {
      const parsedQueryParams = JSON.parse(request.query_params || "{}");
      queryParams = Object.entries(parsedQueryParams).map(
        ([key, value], index) => ({
          id: `param-${Date.now()}-${index}`,
          key,
          value: value as string,
          description: "",
          enabled: true,
        })
      );
    } catch (error) {
      console.error("Failed to parse query params:", error);
    }

    // If no query params were parsed, add an empty one
    if (queryParams.length === 0) {
      queryParams = [
        {
          id: `param-${Date.now()}-0`,
          key: "",
          value: "",
          description: "",
          enabled: true,
        },
      ];
    }

    // If no headers were parsed, add an empty one
    if (headers.length === 0) {
      headers = [
        {
          id: `header-${Date.now()}-0`,
          key: "",
          value: "",
          description: "",
          enabled: true,
        },
      ];
    }

    return {
      config: {
        url: request.url,
        method: request.method as any,
        headers: {},
        timeout: 30000,
      },
      headers,
      queryParams,
      bodyType: request.body ? "raw" : ("none" as any),
      formData: [
        {
          id: `form-${Date.now()}-0`,
          key: "",
          value: "",
          type: "Text" as any,
          description: "",
          enabled: true,
        },
      ],
      rawContent: request.body || "",
      rawFormat: "JSON" as any,
      isLoading: false,
      error: null,
    };
  };

  // Use the new request state management
  const {
    state: requestState,
    updateState: onRequestStateChange,
    validation,
  } = useRequestState(
    initialRequest
      ? convertRequestToState(initialRequest)
      : {
          config: {
            url: "https://jsonplaceholder.typicode.com/posts",
            method: "GET",
            headers: {},
            timeout: 30000,
          },
        }
  );

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

      // Prepare payload for server-side proxy to avoid CORS
      const proxyPayload: any = {
        url,
        method: requestState.config.method,
        headers,
        bodyType: requestState.bodyType,
        rawContent: requestState.rawContent || null,
        formData: requestState.formData
          .filter((f) => f.enabled && f.key.trim())
          .map((f) => ({ key: f.key, value: f.value, type: f.type })),
      };

      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proxyPayload),
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

      // If this is an existing saved request, update it directly
      if (currentRequestId) {
        await updateExistingRequest();
      } else {
        // Show save dialog for new requests
        setShowSaveDialog(true);
      }
    } catch (err) {
      console.error("Save request error:", err);
      toast.error("Failed to save request", {
        description: "An error occurred while saving the request",
      });
    }
  }, [requestState, currentRequestId]);

  const updateExistingRequest = useCallback(async () => {
    try {
      if (!currentRequestId) return;

      // Build headers object
      const headers: Record<string, string> = {};
      requestState.headers
        .filter((h) => h.enabled && h.key.trim())
        .forEach((h) => {
          headers[h.key] = h.value;
        });

      // Build query parameters object
      const queryParams: Record<string, string> = {};
      requestState.queryParams
        .filter((p) => p.enabled && p.key.trim())
        .forEach((p) => {
          queryParams[p.key] = p.value;
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
            (f) => `${encodeURIComponent(f.key)}=${encodeURIComponent(f.value)}`
          )
          .join("&");
        body = formData;
      }

      await databaseService.updateRequest(currentRequestId, {
        method: requestState.config.method,
        url: requestState.config.url,
        headers,
        queryParams,
        body,
      });

      toast.success("Request updated successfully", {
        description: "Your changes have been saved",
      });

      // Refresh collections if callback provided
      if (onCollectionSaved) {
        onCollectionSaved();
      }
    } catch (err) {
      console.error("Update request error:", err);
      toast.error("Failed to update request", {
        description: "An error occurred while updating the request",
      });
    }
  }, [currentRequestId, requestState, onCollectionSaved]);

  const saveRequestToFolder = useCallback(
    async (data: {
      name: string;
      description?: string;
      folderId: string | null;
    }) => {
      try {
        // Build headers object
        const headers: Record<string, string> = {};
        requestState.headers
          .filter((h) => h.enabled && h.key.trim())
          .forEach((h) => {
            headers[h.key] = h.value;
          });

        // Build query parameters object
        const queryParams: Record<string, string> = {};
        requestState.queryParams
          .filter((p) => p.enabled && p.key.trim())
          .forEach((p) => {
            queryParams[p.key] = p.value;
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

        const savedRequest = await databaseService.saveRequest({
          name: data.name,
          folderId: data.folderId,
          method: requestState.config.method,
          url: requestState.config.url,
          headers,
          queryParams,
          body,
        });

        // Set the current request ID so future saves will update instead of create
        setCurrentRequestId(savedRequest.id);

        const folderName = data.folderId ? "selected folder" : "Root";
        toast.success("Request saved successfully", {
          description: `Saved to ${folderName}`,
        });

        // Refresh collections if callback provided
        if (onCollectionSaved) {
          onCollectionSaved();
        }
      } catch (err) {
        console.error("Save request to folder error:", err);
        toast.error("Failed to save request", {
          description: "An error occurred while saving the request",
        });
      }
    },
    [requestState, onCollectionSaved]
  );

  const handleSaveDialogSave = useCallback(
    async (data: {
      name: string;
      description?: string;
      folderId: string | null;
    }) => {
      await saveRequestToFolder(data);
      setShowSaveDialog(false);
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

      {/* Save Request Dialog */}
      <SaveRequestDialog
        isOpen={showSaveDialog}
        onClose={() => setShowSaveDialog(false)}
        onSave={handleSaveDialogSave}
      />

      {/* Sonner Toaster */}
      <Toaster />
    </>
  );
};
