import React, { useState, useCallback, useMemo } from "react";
import {
  Button,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
} from "@freestyle/ui";
import {
  MoreHorizontal,
  PlusIcon,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  RequestBodyConfigProps,
  FormDataRow,
  BodyType,
  RawFormat,
} from "../../../types/api";
import {
  sanitizeInput,
  isValidJson,
  formatJson,
} from "../../../utils/validation";

export default function RequestBodyConfig({
  bodyType,
  formData,
  rawContent,
  rawFormat,
  onBodyTypeChange,
  onFormDataChange,
  onRawContentChange,
  onRawFormatChange,
  className = "",
}: RequestBodyConfigProps) {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showJsonValidation, setShowJsonValidation] = useState(false);

  const addFormDataRow = useCallback(() => {
    const newRow: FormDataRow = {
      id: `form-${Date.now()}`,
      key: "",
      value: "",
      type: "Text",
      description: "",
      enabled: true,
    };
    onFormDataChange([...formData, newRow]);
  }, [formData, onFormDataChange]);

  const updateFormDataRow = useCallback(
    (id: string, field: keyof FormDataRow, value: string | boolean) => {
      const updatedFormData = formData.map((row: FormDataRow) =>
        row.id === id ? { ...row, [field]: value } : row
      );
      onFormDataChange(updatedFormData);
    },
    [formData, onFormDataChange]
  );

  const removeFormDataRow = useCallback(
    (id: string) => {
      onFormDataChange(formData.filter((row: FormDataRow) => row.id !== id));
    },
    [formData, onFormDataChange]
  );

  const handleRawContentChange = useCallback(
    (content: string) => {
      const sanitized = sanitizeInput(content);
      onRawContentChange(sanitized);

      if (rawFormat === "JSON" && sanitized.trim()) {
        setShowJsonValidation(true);
        if (!isValidJson(sanitized)) {
          setValidationErrors(["Invalid JSON format"]);
        } else {
          setValidationErrors([]);
        }
      }
    },
    [rawFormat, onRawContentChange]
  );

  const handleBeautifyJson = useCallback(() => {
    if (rawFormat === "JSON" && rawContent.trim()) {
      const beautified = formatJson(rawContent);
      onRawContentChange(beautified);
    }
  }, [rawFormat, rawContent, onRawContentChange]);

  const isJsonValid = useMemo(() => {
    if (rawFormat !== "JSON" || !rawContent.trim()) return true;
    return isValidJson(rawContent);
  }, [rawFormat, rawContent]);

  const renderContent = () => {
    switch (bodyType) {
      case "none":
        return (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            This request does not have a body
          </div>
        );

      case "form-data":
      case "x-www-form-urlencoded":
        const isFormData = bodyType === "form-data";
        return (
          <div className="border overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-muted border-b text-xs font-medium text-muted-foreground">
              <div className="col-span-1 ml-1 mt-1">
                <input
                  type="checkbox"
                  className="rounded"
                  aria-label="Enable all form fields"
                />
              </div>
              <div className={`col-span-${isFormData ? 3 : 4} ml-1 mt-1`}>
                Key
              </div>
              <div className={`col-span-${isFormData ? 4 : 4} ml-1 mt-1`}>
                Value
              </div>
              <div className={`col-span-${isFormData ? 3 : 3} ml-1 mt-1`}>
                Description
              </div>
              <div className="col-span-1 text-right">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  Bulk Edit
                </Button>
              </div>
            </div>

            {formData.map((row: FormDataRow, index: number) => (
              <div
                key={row.id}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b items-center"
              >
                <div className="col-span-1">
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) =>
                      updateFormDataRow(row.id, "enabled", e.target.checked)
                    }
                    className="rounded"
                    aria-label={`Enable form field ${row.key || index + 1}`}
                  />
                </div>
                <Input
                  placeholder="Key"
                  value={row.key}
                  onChange={(e) =>
                    updateFormDataRow(
                      row.id,
                      "key",
                      sanitizeInput(e.target.value)
                    )
                  }
                  className={`col-span-${isFormData ? 3 : 4} h-8`}
                  aria-label={`Form field key ${index + 1}`}
                />

                <div className={`col-span-${isFormData ? 4 : 4} flex gap-2`}>
                  {isFormData && (
                    <Select
                      value={row.type}
                      onValueChange={(value) =>
                        updateFormDataRow(
                          row.id,
                          "type",
                          value as "Text" | "File"
                        )
                      }
                      aria-label={`Form field type ${index + 1}`}
                    >
                      <SelectTrigger className="w-20 h-8 text-sm" />
                      <SelectContent>
                        <SelectItem value="Text">Text</SelectItem>
                        <SelectItem value="File">File</SelectItem>
                      </SelectContent>
                    </Select>
                  )}

                  {row.type === "File" ? (
                    <Input
                      type="file"
                      className="h-8 text-sm flex-1"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        updateFormDataRow(row.id, "value", file?.name ?? "");
                      }}
                      aria-label={`Form field file ${index + 1}`}
                    />
                  ) : (
                    <Input
                      placeholder="Value"
                      value={row.value}
                      onChange={(e) =>
                        updateFormDataRow(
                          row.id,
                          "value",
                          sanitizeInput(e.target.value)
                        )
                      }
                      className="h-8 text-sm flex-1"
                      aria-label={`Form field value ${index + 1}`}
                    />
                  )}
                </div>

                <Input
                  placeholder="Description"
                  value={row.description}
                  onChange={(e) =>
                    updateFormDataRow(
                      row.id,
                      "description",
                      sanitizeInput(e.target.value)
                    )
                  }
                  className={`col-span-${isFormData ? 3 : 3} h-8`}
                  aria-label={`Form field description ${index + 1}`}
                />

                <div className="col-span-1 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeFormDataRow(row.id)}
                    aria-label={`Remove form field ${row.key || index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-center py-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={addFormDataRow}
                aria-label="Add new form field"
              >
                <PlusIcon />
                Add more
              </Button>
            </div>
          </div>
        );

      case "raw":
        return (
          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <Select
                value={rawFormat}
                onValueChange={(value) => onRawFormatChange(value as RawFormat)}
                aria-label="Raw content format"
              >
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JSON">JSON</SelectItem>
                  <SelectItem value="XML">XML</SelectItem>
                  <SelectItem value="HTML">HTML</SelectItem>
                  <SelectItem value="Text">Text</SelectItem>
                  <SelectItem value="JavaScript">JavaScript</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                {rawFormat === "JSON" && (
                  <Button
                    variant="link"
                    size="sm"
                    className="text-blue-600 text-sm"
                    onClick={handleBeautifyJson}
                    disabled={!rawContent.trim()}
                    aria-label="Beautify JSON"
                  >
                    Beautify
                  </Button>
                )}
                {showJsonValidation && (
                  <div className="flex items-center gap-1">
                    {isJsonValid ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span
                      className={`text-xs ${isJsonValid ? "text-green-600" : "text-red-600"}`}
                    >
                      {isJsonValid ? "Valid JSON" : "Invalid JSON"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {validationErrors.length > 0 && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {validationErrors.join(", ")}
                </AlertDescription>
              </Alert>
            )}

            <div className="relative">
              <textarea
                value={rawContent}
                onChange={(e) => handleRawContentChange(e.target.value)}
                placeholder="Paste your raw request body here..."
                className={`w-full h-64 px-4 py-2 border font-mono text-sm focus:outline-none ${
                  showJsonValidation && !isJsonValid ? "border-red-500" : ""
                }`}
                aria-label="Raw request body content"
                aria-invalid={showJsonValidation && !isJsonValid}
              />
            </div>
          </div>
        );

      case "binary":
        return (
          <div className="p-4">
            <Input
              type="file"
              className="w-md mt-2"
              aria-label="Binary file upload"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`w-full mx-auto ${className}`}>
      <div className="px-4 pb-2">
        <RadioGroup
          value={bodyType}
          onValueChange={(type) => onBodyTypeChange(type as BodyType)}
          className="flex flex-wrap gap-4"
          aria-label="Request body type"
        >
          {["none", "form-data", "x-www-form-urlencoded", "raw", "binary"].map(
            (type) => (
              <div key={type} className="flex items-center space-x-2">
                <RadioGroupItem
                  value={type}
                  id={type}
                  aria-describedby={`${type}-description`}
                />
                <Label
                  htmlFor={type}
                  className="text-sm cursor-pointer"
                  id={`${type}-description`}
                >
                  {type === "x-www-form-urlencoded" ? "URL Encoded" : type}
                </Label>
              </div>
            )
          )}
        </RadioGroup>
      </div>

      <div>{renderContent()}</div>
    </div>
  );
}
