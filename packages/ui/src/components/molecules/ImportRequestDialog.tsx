"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Textarea,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  Field,
  FieldLabel,
  FieldContent,
  FieldGroup,
  databaseService,
  Folder,
  Request,
} from "@freestyle/ui";
import { ChevronRight, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { Editor } from "@monaco-editor/react";

interface ImportRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImportWithoutSaving?: (request: Request) => void;
}

type ParsedCurl = {
  method: string;
  url: string;
  headers: Record<string, string>;
  queryParams: Record<string, string>;
  body: string | null;
};

// Lightweight cURL parser (supports common flags: -X, -H, --header, -d/--data/--data-raw/--data-binary)
function parseCurlCommand(input: string): ParsedCurl {
  if (!input.trim().toLowerCase().startsWith("curl ")) {
    throw new Error("Input must start with curl");
  }

  const tokens: string[] = [];
  let buf = "";
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!; // assert non-null so .test(ch) won't error
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }
    if (!inSingle && !inDouble && /\s/.test(ch)) {
      if (buf) {
        tokens.push(buf);
        buf = "";
      }
    } else {
      buf += ch;
    }
  }
  if (buf) tokens.push(buf);

  // Remove initial curl token
  if (tokens[0]!.toLowerCase() === "curl") {
    tokens.shift();
  }

  let method = "GET";
  let url = "";
  const headers: Record<string, string> = {};
  let body: string | null = null;

  const takeValue = (i: number, flag: string): [number, string] => {
    // Supports --flag=value or --flag value
    const token = tokens[i]!;
    const eqIndex = token.indexOf("=");
    if (eqIndex !== -1) {
      return [i, token.slice(eqIndex + 1)];
    }
    if (i + 1 < tokens.length) {
      return [i + 1, tokens[i + 1]!];
    }
    throw new Error(`Expected value after ${flag}`);
  };

  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i]!;
    const lower = t.toLowerCase();
    if (lower === "-x" || lower === "--request") {
      const [nextIdx, val] = takeValue(i, t);
      method = val.toUpperCase();
      i = nextIdx;
      continue;
    }
    if (lower === "-h" || lower === "--header") {
      const [nextIdx, val] = takeValue(i, t);
      const sep = val.indexOf(":");
      if (sep === -1) throw new Error("Invalid header format");
      const key = val.slice(0, sep).trim();
      const value = val.slice(sep + 1).trim();
      if (key) headers[key] = value;
      i = nextIdx;
      continue;
    }
    if (
      lower === "-d" ||
      lower === "--data" ||
      lower === "--data-raw" ||
      lower === "--data-binary"
    ) {
      const [nextIdx, val] = takeValue(i, t);
      body = val;
      if (method === "GET") method = "POST"; // default when data present
      i = nextIdx;
      continue;
    }
    if (!t.startsWith("-")) {
      // Assume this is the URL
      url = t;
      continue;
    }
  }

  if (!url) throw new Error("URL not found in curl");

  // Extract query params
  const queryParams: Record<string, string> = {};
  try {
    const u = new URL(url.replace(/^\"|\"$/g, ""));
    url = `${u.origin}${u.pathname}`;
    u.searchParams.forEach((v, k) => {
      queryParams[k] = v;
    });
  } catch {
    // If URL constructor fails, keep raw url
  }

  return { method, url, headers, queryParams, body };
}

export const ImportRequestDialog: React.FC<ImportRequestDialogProps> = ({
  isOpen,
  onClose,
  onImportWithoutSaving,
}) => {
  const [curlText, setCurlText] = useState("");
  const [curlError, setCurlError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCurl | null>(null);
  const [requestName, setRequestName] = useState("");

  // Folders state (reuse selector behavior from SaveRequestDialog)
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      (async () => {
        try {
          const list = await databaseService.getFolders();
          setFolders(list);
        } catch (e) {
          console.error(e);
        }
      })();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      // Reset all form-related states when dialog is closed
      setCurlText("");
      setCurlError(null);
      setParsed(null);
      setRequestName("");
      setSearchQuery("");
      setCurrentFolderId(null);
      setFolderPath([]);
      setSelectedFolderId(null);
    }
  }, [isOpen]);

  const getCurrentFolderContents = useCallback(
    (all: Folder[], parentId: string | null) =>
      all.filter((f) => f.parent_id === parentId),
    []
  );

  const navigateToFolder = useCallback(
    (folderId: string | null) => {
      setCurrentFolderId(folderId);
      const folder = folders.find((f) => f.id === folderId);
      if (folderId && folder) {
        const path: Folder[] = [];
        let cur: string | null = folderId;
        while (cur) {
          const cf = folders.find((f) => f.id === cur);
          if (cf) {
            path.unshift(cf);
            cur = cf.parent_id || null;
          } else {
            break;
          }
        }
        setFolderPath(path);
      } else {
        setFolderPath([]);
      }
    },
    [folders]
  );

  const getSelectedFolderPath = useCallback(
    (folderId: string | null) => {
      if (!folderId) return "Root";
      const path: string[] = [];
      let cur: string | null = folderId;
      while (cur) {
        const f = folders.find((x) => x.id === cur);
        if (f) {
          path.unshift(f.name);
          cur = f.parent_id || null;
        } else {
          break;
        }
      }
      return path.join(" / ");
    },
    [folders]
  );

  const currentFolderContents = useMemo(
    () => getCurrentFolderContents(folders, currentFolderId),
    [folders, currentFolderId, getCurrentFolderContents]
  );

  const filteredFolders = useMemo(
    () =>
      currentFolderContents.filter((f) =>
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [currentFolderContents, searchQuery]
  );

  const onCurlChange = (val: string) => {
    setCurlText(val);
    if (!val.trim()) {
      setCurlError(null);
      setParsed(null);
      return;
    }
    try {
      const p = parseCurlCommand(val.trim());
      setParsed(p);
      setCurlError(null);
    } catch (e: any) {
      setParsed(null);
      setCurlError(e?.message || "Invalid cURL command");
    }
  };

  const handleImportWithoutSaving = async () => {
    if (!parsed) return;
    const request: Request = {
      id: `temp-${Date.now()}`, // Temporary unique ID
      name: requestName || `Imported Request (${parsed.method} ${parsed.url})`,
      method: parsed.method,
      url: parsed.url,
      headers: JSON.stringify(parsed.headers),
      query_params: JSON.stringify(parsed.queryParams),
      body: parsed.body || null,
      folder_id: null, // No folder since it's not saved
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    toast.success("Imported request (not saved)");
    onImportWithoutSaving?.(request);
    onClose();
  };

  const handleImportIntoFolder = async () => {
    if (!parsed) return;
    if (!requestName.trim()) return;
    try {
      await databaseService.saveRequest({
        name: requestName.trim(),
        folderId: selectedFolderId,
        method: parsed.method,
        url: parsed.url,
        headers: parsed.headers,
        queryParams: parsed.queryParams,
        body: parsed.body,
      });
      toast.success("Request imported into collection");
      onClose();
      // Reset local state
      setCurlText("");
      setParsed(null);
      setRequestName("");
      setSelectedFolderId(null);
      setSearchQuery("");
      setCurrentFolderId(null);
      setFolderPath([]);
    } catch (e) {
      toast.error("Failed to save request");
      console.error(e);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Request</DialogTitle>
        </DialogHeader>

        <FieldGroup>
          {!parsed && (
            <Field>
              <FieldContent>
                <Textarea
                  id="curl-text"
                  placeholder="Paste cURL"
                  value={curlText}
                  onChange={(e) => onCurlChange(e.target.value)}
                  aria-invalid={!!curlError}
                  rows={6}
                />
                {curlError && (
                  <div className="text-xs text-destructive mt-1">
                    {curlError}
                  </div>
                )}
              </FieldContent>
            </Field>
          )}

          {parsed && (
            <>
              <Editor
                className="h-42"
                language="shell"
                value={curlText}
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

              <Field>
                <FieldLabel htmlFor="request-name">Request Name</FieldLabel>
                <FieldContent>
                  <Input
                    id="request-name"
                    placeholder="Enter request name"
                    value={requestName}
                    onChange={(e) => setRequestName(e.target.value)}
                  />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel>
                  <div className="flex items-center gap-2 text-sm">
                    Save To
                    {selectedFolderId ? (
                      <div className="flex items-center gap-1 text-xs">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => navigateToFolder(null)}
                            className="hover:text-foreground transition-colors"
                          >
                            Root
                          </button>
                          {getSelectedFolderPath(selectedFolderId)
                            .split(" / ")
                            .map((folderName, index) => {
                              const folderInPath = folderPath[index];
                              return (
                                <React.Fragment key={index}>
                                  <ChevronRight className="h-3 w-3" />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigateToFolder(folderInPath?.id || null)
                                    }
                                    className="cursor-pointer hover:underline hover:text-foreground transition-colors"
                                  >
                                    {folderName}
                                  </button>
                                </React.Fragment>
                              );
                            })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-foreground text-xs">
                        <button
                          type="button"
                          onClick={() => navigateToFolder(null)}
                          className="hover:text-muted-foreground transition-colors"
                        >
                          Root
                        </button>
                        {folderPath.map((folder) => (
                          <React.Fragment key={folder.id}>
                            <ChevronRight className="h-3 w-3" />
                            <button
                              type="button"
                              onClick={() => navigateToFolder(folder.id)}
                              className="hover:text-foreground transition-colors"
                            >
                              {folder.name}
                            </button>
                          </React.Fragment>
                        ))}
                      </div>
                    )}
                  </div>
                </FieldLabel>
                <FieldContent>
                  <Command className="border">
                    <CommandInput
                      placeholder="Search folders..."
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandList className="max-h-48">
                      <CommandEmpty>No folders found.</CommandEmpty>
                      {filteredFolders.map((folder) => (
                        <CommandItem
                          key={folder.id}
                          value={folder.name}
                          onSelect={() => {
                            setSelectedFolderId(folder.id);
                            navigateToFolder(folder.id);
                          }}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-muted-foreground" />
                            <span>{folder.name}</span>
                          </div>
                          {selectedFolderId === folder.id && (
                            <div className="h-2 w-2 bg-primary" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandList>
                  </Command>
                </FieldContent>
              </Field>
            </>
          )}
        </FieldGroup>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleImportWithoutSaving}
            disabled={!parsed}
          >
            Import without saving
          </Button>
          <Button
            onClick={handleImportIntoFolder}
            disabled={!parsed || !requestName.trim()}
          >
            Import into Folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
