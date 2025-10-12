import React, { useState } from "react";
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
} from "@freestyle/ui";
import { MoreHorizontal, PlusIcon } from "lucide-react";

export default function RequestBodyConfig() {
  const [bodyType, setBodyType] = useState("none");
  const [formDataRows, setFormDataRows] = useState<FormDataRow[]>([
    { key: "", value: "", type: "Text", description: "" },
  ]);
  const [rawContent, setRawContent] = useState("");
  const [rawFormat, setRawFormat] = useState("JSON");

  interface FormDataRow {
    key: string;
    value: string;
    type: "Text" | "File";
    description: string;
  }

  type FormDataRowField = keyof FormDataRow;

  const addFormDataRow = () => {
    setFormDataRows([
      ...formDataRows,
      { key: "", value: "", type: "Text", description: "" },
    ]);
  };

  const updateFormDataRow = (
    index: number,
    field: FormDataRowField,
    value: string
  ) => {
    const newRows = [...formDataRows];
    if (newRows[index]) {
      newRows[index] = {
        ...newRows[index],
        [field]: value ?? "", // ensure it's always a string
      };
    }
    setFormDataRows(newRows);
  };

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
              <div className={`col-span-${isFormData ? 3 : 4} ml-1 mt-1`}>
                Key
              </div>
              <div className={`col-span-${isFormData ? 4 : 4} ml-1 mt-1`}>
                Value
              </div>
              <div className={`col-span-${isFormData ? 4 : 3} ml-1 mt-1`}>
                Description
              </div>
              <div className="col-span-1 text-right">
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  Bulk Edit
                </Button>
              </div>
            </div>

            {formDataRows.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b items-center"
              >
                <Input
                  placeholder="Key"
                  value={row.key ?? ""}
                  onChange={(e) =>
                    updateFormDataRow(index, "key", e.target.value)
                  }
                  className={`col-span-${isFormData ? 3 : 4} h-8`}
                />

                <div className={`col-span-${isFormData ? 4 : 4} flex gap-2`}>
                  {isFormData && (
                    <Select
                      value={row.type ?? "Text"}
                      onValueChange={(value) =>
                        updateFormDataRow(index, "type", value)
                      }
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
                        updateFormDataRow(index, "value", file?.name ?? "");
                      }}
                    />
                  ) : (
                    <Input
                      placeholder="Value"
                      onChange={(e) =>
                        updateFormDataRow(index, "value", e.target.value)
                      }
                      className="h-8 text-sm flex-1"
                    />
                  )}
                </div>

                <Input
                  placeholder="Description"
                  value={row.description ?? ""}
                  onChange={(e) =>
                    updateFormDataRow(index, "description", e.target.value)
                  }
                  className={`col-span-${isFormData ? 4 : 3} h-8`}
                />

                <div className="col-span-1 text-right">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="flex justify-center py-2">
              <Button size="sm" variant="secondary" onClick={addFormDataRow}>
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
              <Select value={rawFormat} onValueChange={setRawFormat}>
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JSON">JSON</SelectItem>
                  <SelectItem value="XML">XML</SelectItem>
                  <SelectItem value="HTML">HTML</SelectItem>
                  <SelectItem value="Text">Text</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="link"
                size="sm"
                className="text-blue-600 text-sm"
              >
                Beautify
              </Button>
            </div>
            <div className="relative">
              <textarea
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder="Paste your raw request body here..."
                className="w-full h-64 px-4 py-2 border font-mono text-sm focus:outline-none"
              />
            </div>
          </div>
        );

      case "binary":
        return (
          <div className="p-4">
            <Input type="file" className="w-md mt-2" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full mx-auto">
      <div className="px-4 pb-2">
        <RadioGroup
          value={bodyType}
          onValueChange={setBodyType}
          className="flex flex-wrap gap-4"
        >
          {["none", "form-data", "x-www-form-urlencoded", "raw", "binary"].map(
            (type) => (
              <div key={type} className="flex items-center space-x-2">
                <RadioGroupItem value={type} id={type} />
                <Label htmlFor={type} className="text-sm cursor-pointer">
                  {type}
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
