import { useState, useCallback, useMemo } from "react";
import {
  SendHorizonal,
  SaveIcon,
  Share,
  MoreHorizontal,
  PlusIcon,
  Trash2,
  Clock,
} from "lucide-react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  sanitizeInput,
} from "@freestyle/ui";
import RequestBodyConfig from "./RequestBodyConfig";
import {
  RequestSectionProps,
  RequestHeader,
  QueryParam,
  BodyType,
  FormDataRow,
  RawFormat,
} from "../../../types/api";

export const RequestSection = ({
  requestState,
  onRequestStateChange,
  onMakeRequest,
  onSaveRequest,
  onShareRequest,
  className = "",
}: RequestSectionProps) => {
  const [activeTab, setActiveTab] = useState("params");
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  const handleUrlChange = useCallback(
    (url: string) => {
      const sanitizedUrl = sanitizeInput(url);
      onRequestStateChange({
        config: { ...requestState.config, url: sanitizedUrl },
      });
    },
    [requestState.config, onRequestStateChange]
  );

  const handleMethodChange = useCallback(
    (method: string) => {
      onRequestStateChange({
        config: { ...requestState.config, method: method as any },
      });
    },
    [requestState.config, onRequestStateChange]
  );

  const handleMakeRequest = useCallback(async () => {
    if (!requestState.config.url.trim()) {
      setShowValidationErrors(true);
      return;
    }

    onRequestStateChange({ isLoading: true, error: null });
    try {
      await onMakeRequest();
    } catch (error) {
      onRequestStateChange({
        error: error instanceof Error ? error.message : "Request failed",
      });
    } finally {
      onRequestStateChange({ isLoading: false });
    }
  }, [requestState.config.url, onRequestStateChange, onMakeRequest]);

  const enabledHeadersCount = useMemo(
    () =>
      requestState.headers.filter(
        (h: RequestHeader) => h.enabled && h.key.trim()
      ).length,
    [requestState.headers]
  );

  const enabledParamsCount = useMemo(
    () =>
      requestState.queryParams.filter(
        (p: QueryParam) => p.enabled && p.key.trim()
      ).length,
    [requestState.queryParams]
  );

  return (
    <div className={`min-h-[300px] ${className}`}>
      <div className="p-4">
        <div className="flex items-center gap-2">
          <Select
            value={requestState.config.method.toLowerCase()}
            onValueChange={handleMethodChange}
            aria-label="HTTP Method"
          >
            <SelectTrigger className="w-32 font-bold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="get" className="font-bold text-green-600">
                GET
              </SelectItem>
              <SelectItem value="post" className="font-bold text-yellow-700">
                POST
              </SelectItem>
              <SelectItem value="put" className="font-bold text-blue-700">
                PUT
              </SelectItem>
              <SelectItem value="patch" className="font-bold text-purple-700">
                PATCH
              </SelectItem>
              <SelectItem value="delete" className="font-bold text-red-700">
                DELETE
              </SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder="Enter URL"
            className="flex-1"
            value={requestState.config.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            aria-label="Request URL"
            aria-invalid={
              showValidationErrors && !requestState.config.url.trim()
            }
          />
          <Button
            onClick={handleMakeRequest}
            disabled={requestState.isLoading}
            aria-label="Send Request"
          >
            {requestState.isLoading ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <SendHorizonal className="h-4 w-4" />
            )}
            Send
          </Button>
          {onSaveRequest && (
            <Button
              variant="secondary"
              onClick={onSaveRequest}
              aria-label="Save Request"
            >
              <SaveIcon className="h-4 w-4" />
            </Button>
          )}
          {onShareRequest && (
            <Button
              variant="secondary"
              onClick={onShareRequest}
              aria-label="Share Request"
            >
              <Share className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex flex-col"
      >
        <div className="flex items-center border-b px-4 -mx-4">
          <TabsList className="h-10 p-0 bg-transparent" role="tablist">
            <TabsTrigger
              value="params"
              role="tab"
              aria-selected={activeTab === "params"}
              aria-controls="params-panel"
            >
              Params
              {enabledParamsCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {enabledParamsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="headers"
              role="tab"
              aria-selected={activeTab === "headers"}
              aria-controls="headers-panel"
            >
              Headers
              {enabledHeadersCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {enabledHeadersCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="body"
              role="tab"
              aria-selected={activeTab === "body"}
              aria-controls="body-panel"
            >
              Body
            </TabsTrigger>
          </TabsList>
          <div className="flex-1"></div>
          <Button variant="link" size="sm" className="text-blue-600">
            Cookies
          </Button>
        </div>

        <TabsContent
          value="params"
          className="flex-1 px-4"
          id="params-panel"
          role="tabpanel"
          aria-labelledby="params-tab"
        >
          <div>
            <h3 className="text-sm font-medium mb-3">Query Params</h3>
            <div className="border overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted border-b text-xs font-medium text-muted-foreground">
                <div className="col-span-1 ml-1 mt-1">
                  <input
                    type="checkbox"
                    className="rounded"
                    aria-label="Enable all params"
                  />
                </div>
                <div className="col-span-3 ml-1 mt-1">Key</div>
                <div className="col-span-3 ml-1 mt-1">Value</div>
                <div className="col-span-4 ml-1 mt-1">Description</div>
                <div className="col-span-1 text-right"></div>
              </div>

              {requestState.queryParams.map(
                (param: QueryParam, index: number) => (
                  <div
                    key={param.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 border-b items-center"
                  >
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={param.enabled}
                        onChange={(e) =>
                          onRequestStateChange({
                            queryParams: requestState.queryParams.map(
                              (p: QueryParam) =>
                                p.id === param.id
                                  ? { ...p, enabled: e.target.checked }
                                  : p
                            ),
                          })
                        }
                        className="rounded"
                        aria-label={`Enable parameter ${param.key || index + 1}`}
                      />
                    </div>
                    <Input
                      placeholder="Key"
                      className="col-span-3 h-8"
                      value={param.key}
                      onChange={(e) =>
                        onRequestStateChange({
                          queryParams: requestState.queryParams.map(
                            (p: QueryParam) =>
                              p.id === param.id
                                ? { ...p, key: sanitizeInput(e.target.value) }
                                : p
                          ),
                        })
                      }
                      aria-label={`Parameter key ${index + 1}`}
                    />
                    <Input
                      placeholder="Value"
                      className="col-span-3 h-8"
                      value={param.value}
                      onChange={(e) =>
                        onRequestStateChange({
                          queryParams: requestState.queryParams.map(
                            (p: QueryParam) =>
                              p.id === param.id
                                ? { ...p, value: sanitizeInput(e.target.value) }
                                : p
                          ),
                        })
                      }
                      aria-label={`Parameter value ${index + 1}`}
                    />
                    <Input
                      placeholder="Description"
                      className="col-span-4 h-8"
                      value={param.description}
                      onChange={(e) =>
                        onRequestStateChange({
                          queryParams: requestState.queryParams.map(
                            (p: QueryParam) =>
                              p.id === param.id
                                ? {
                                    ...p,
                                    description: sanitizeInput(e.target.value),
                                  }
                                : p
                          ),
                        })
                      }
                      aria-label={`Parameter description ${index + 1}`}
                    />
                    <div className="col-span-1 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          // Don't allow removing the last parameter
                          if (requestState.queryParams.length > 1) {
                            onRequestStateChange({
                              queryParams: requestState.queryParams.filter(
                                (p) => p.id !== param.id
                              ),
                            });
                          }
                        }}
                        disabled={requestState.queryParams.length <= 1}
                        aria-label={`Remove parameter ${param.key || index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              )}

              <div className="flex justify-center py-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    onRequestStateChange({
                      queryParams: [
                        ...requestState.queryParams,
                        {
                          id: `param-${Date.now()}`,
                          key: "",
                          value: "",
                          description: "",
                          enabled: true,
                        },
                      ],
                    })
                  }
                  aria-label="Add new parameter"
                >
                  <PlusIcon />
                  Add more
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="headers"
          className="flex-1 px-4"
          id="headers-panel"
          role="tabpanel"
          aria-labelledby="headers-tab"
        >
          <div>
            <h3 className="text-sm font-medium mb-3">Headers</h3>
            <div className="border overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted border-b text-xs font-medium text-muted-foreground">
                <div className="col-span-1 ml-1 mt-1">
                  <input
                    type="checkbox"
                    className="rounded"
                    aria-label="Enable all headers"
                  />
                </div>
                <div className="col-span-3 ml-1 mt-1">Key</div>
                <div className="col-span-3 ml-1 mt-1">Value</div>
                <div className="col-span-4 ml-1 mt-1">Description</div>
                <div className="col-span-1 text-right"></div>
              </div>

              {requestState.headers.map(
                (header: RequestHeader, index: number) => (
                  <div
                    key={header.id}
                    className="grid grid-cols-12 gap-4 px-4 py-3 border-b items-center"
                  >
                    <div className="col-span-1">
                      <input
                        type="checkbox"
                        checked={header.enabled}
                        onChange={(e) =>
                          onRequestStateChange({
                            headers: requestState.headers.map(
                              (h: RequestHeader) =>
                                h.id === header.id
                                  ? { ...h, enabled: e.target.checked }
                                  : h
                            ),
                          })
                        }
                        className="rounded"
                        aria-label={`Enable header ${header.key || index + 1}`}
                      />
                    </div>
                    <Input
                      placeholder="Key"
                      className="col-span-3 h-8"
                      value={header.key}
                      onChange={(e) =>
                        onRequestStateChange({
                          headers: requestState.headers.map(
                            (h: RequestHeader) =>
                              h.id === header.id
                                ? { ...h, key: sanitizeInput(e.target.value) }
                                : h
                          ),
                        })
                      }
                      aria-label={`Header key ${index + 1}`}
                    />
                    <Input
                      placeholder="Value"
                      className="col-span-3 h-8"
                      value={header.value}
                      onChange={(e) =>
                        onRequestStateChange({
                          headers: requestState.headers.map(
                            (h: RequestHeader) =>
                              h.id === header.id
                                ? { ...h, value: sanitizeInput(e.target.value) }
                                : h
                          ),
                        })
                      }
                      aria-label={`Header value ${index + 1}`}
                    />
                    <Input
                      placeholder="Description"
                      className="col-span-4 h-8"
                      value={header.description}
                      onChange={(e) =>
                        onRequestStateChange({
                          headers: requestState.headers.map(
                            (h: RequestHeader) =>
                              h.id === header.id
                                ? {
                                    ...h,
                                    description: sanitizeInput(e.target.value),
                                  }
                                : h
                          ),
                        })
                      }
                      aria-label={`Header description ${index + 1}`}
                    />
                    <div className="col-span-1 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          // Don't allow removing the last header
                          if (requestState.headers.length > 1) {
                            onRequestStateChange({
                              headers: requestState.headers.filter(
                                (h) => h.id !== header.id
                              ),
                            });
                          }
                        }}
                        disabled={requestState.headers.length <= 1}
                        aria-label={`Remove header ${header.key || index + 1}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              )}

              <div className="flex justify-center py-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    onRequestStateChange({
                      headers: [
                        ...requestState.headers,
                        {
                          id: `header-${Date.now()}`,
                          key: "",
                          value: "",
                          description: "",
                          enabled: true,
                        },
                      ],
                    })
                  }
                  aria-label="Add new header"
                >
                  <PlusIcon />
                  Add more
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="body"
          className="flex-1 px-4"
          id="body-panel"
          role="tabpanel"
          aria-labelledby="body-tab"
        >
          <RequestBodyConfig
            bodyType={requestState.bodyType}
            formData={requestState.formData}
            rawContent={requestState.rawContent}
            rawFormat={requestState.rawFormat}
            onBodyTypeChange={(type: BodyType) =>
              onRequestStateChange({ bodyType: type })
            }
            onFormDataChange={(formData: FormDataRow[]) =>
              onRequestStateChange({ formData })
            }
            onRawContentChange={(content: string) =>
              onRequestStateChange({ rawContent: content })
            }
            onRawFormatChange={(format: RawFormat) =>
              onRequestStateChange({ rawFormat: format })
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
