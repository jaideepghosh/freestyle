import { ChevronDown, Copy, History, Check } from "lucide-react";
import { useState } from "react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@freestyle/ui";
import Editor from "@monaco-editor/react";

export const ResponseSection = ({ response }: { response: any }) => {
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [isCopied, setIsCopied] = useState(false);

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
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-medium">Response</h3>
        <Button variant="ghost" size="sm" className="h-8">
          <History className="h-4 w-4" />
          History
          <ChevronDown className="h-4 w-4" />
        </Button>
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
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="javascript">JSON</SelectItem>
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
        <Editor
          height={"500px"}
          language={selectedLanguage}
          value={response && JSON.stringify(response, null, 2)}
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
      {/* Empty State */}
    </div>
  );
};
