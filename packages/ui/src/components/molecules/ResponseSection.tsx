import { Copy, Check, Play, Loader2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import {
  Button,
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
} from "@freestyle/ui";
import Editor from "@monaco-editor/react";

export const ResponseSection = ({
  response,
  responseType,
  responseHeader,
  isLoading = false,
}: {
  response: any;
  responseType: any;
  responseHeader: any;
  isLoading?: boolean;
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState("plaintext");
  const [isCopied, setIsCopied] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Automatically set language based on responseType
  useEffect(() => {
    if (responseType === "json") {
      setSelectedLanguage("javascript");
    } else if (responseType === "html") {
      setSelectedLanguage("html");
    } else {
      setSelectedLanguage("plaintext");
    }
  }, [responseType]);

  const responseHeadersCount = useMemo(() => {
    return responseHeader ? Object.keys(responseHeader).length : 0;
  }, [responseHeader]);

  const handleCopy = async () => {
    if (response) {
      const textToCopy =
        selectedLanguage === "javascript"
          ? JSON.stringify(response, null, 2)
          : JSON.stringify(response);

      try {
        await navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        // Reset the animation after 2 seconds
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy text: ", err);
      }
    }
  };
  return (
    <div className="mt-2">
      <div className="relative">
        <Tabs defaultValue="body" className="w-full">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-sm font-medium">Response</h3>

            <TabsList className="bg-transparent">
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="headers">
                Headers
                {responseHeadersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {responseHeadersCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            {/* <Button variant="ghost" size="sm" className="h-8">
            <History className="h-4 w-4" />
            History
            <ChevronDown className="h-4 w-4" />
          </Button> */}
            <div className="ml-auto flex items-center gap-2">
              {response && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-8 transition-all duration-200 ${
                    isCopied
                      ? "bg-green-100 text-green-600 scale-110"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={handleCopy}
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 transition-all duration-200 scale-110" />
                  ) : (
                    <Copy className="h-4 w-4 transition-transform duration-200" />
                  )}
                </Button>
              )}
              {responseType === "html" && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                >
                  <Play />
                  {isPreviewMode ? "Editor" : "Preview"}
                </Button>
              )}
              <Select
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {responseType === "json" && (
                    <SelectItem value="javascript">JSON</SelectItem>
                  )}{" "}
                  {responseType === "html" && (
                    <SelectItem value="html">HTML</SelectItem>
                  )}
                  <SelectItem value="plaintext">Raw</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {!response ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground text-sm">
                Enter the URL and click Send to get a response
              </p>
            </div>
          ) : (
            <>
              <TabsContent value="body">
                {isPreviewMode && responseType === "html" ? (
                  <div className="border h-[50vh] overflow-auto">
                    <iframe
                      srcDoc={response}
                      className="w-full h-full border-0"
                      title="HTML Preview"
                    />
                  </div>
                ) : (
                  <Editor
                    className="h-[50vh]"
                    language={selectedLanguage}
                    value={
                      response && responseType === "json"
                        ? JSON.stringify(response, null, 2)
                        : response
                    }
                    options={{
                      readOnly: true,
                      lineNumbers: "on",
                      folding: true,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      automaticLayout: true,
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="headers">
                {responseHeader ? (
                  <div className="border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.entries(responseHeader).map(
                            ([key, value]) => (
                              <tr key={key} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm font-mono text-blue-600">
                                  {key}
                                </td>
                                <td className="px-4 py-2 text-sm font-mono text-gray-700 break-all">
                                  {value as string}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-muted-foreground text-sm">
                      No headers available
                    </p>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Loading response...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
