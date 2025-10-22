"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  databaseService,
  Folder,
  Field,
  FieldLabel,
  FieldContent,
  FieldGroup,
} from "@freestyle/ui";
import {
  FolderPlus,
  ChevronRight,
  ChevronLeft,
  FolderOpen,
} from "lucide-react";

interface SaveRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    folderId: string | null;
  }) => void;
}

export const SaveRequestDialog: React.FC<SaveRequestDialogProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [requestName, setRequestName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);

  // Load folders when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = useCallback(async () => {
    try {
      setIsLoading(true);
      const folderList = await databaseService.getFolders();
      setFolders(folderList);
    } catch (error) {
      console.error("Failed to load folders:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Build folder tree structure
  const buildFolderTree = useCallback((folders: Folder[]) => {
    const folderMap = new Map<string, Folder & { children: Folder[] }>();
    const rootFolders: (Folder & { children: Folder[] })[] = [];

    // Initialize all folders with children array
    folders.forEach((folder) => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    // Build the tree structure
    folders.forEach((folder) => {
      const folderWithChildren = folderMap.get(folder.id)!;
      if (folder.parent_id) {
        const parent = folderMap.get(folder.parent_id);
        if (parent) {
          parent.children.push(folderWithChildren);
        }
      } else {
        rootFolders.push(folderWithChildren);
      }
    });

    return rootFolders;
  }, []);

  // Get folders in current directory
  const getCurrentFolderContents = useCallback(
    (folders: Folder[], currentFolderId: string | null) => {
      return folders.filter((folder) => folder.parent_id === currentFolderId);
    },
    []
  );

  // Navigate to a folder
  const navigateToFolder = useCallback(
    (folderId: string | null) => {
      setCurrentFolderId(folderId);
      const folder = folders.find((f) => f.id === folderId);

      if (folderId && folder) {
        // Build path to this folder
        const path: Folder[] = [];
        let currentId: string | null = folderId;

        while (currentId) {
          const currentFolder = folders.find((f) => f.id === currentId);
          if (currentFolder) {
            path.unshift(currentFolder);
            currentId = currentFolder.parent_id || null;
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

  // Navigate back to parent folder
  const navigateBack = useCallback(() => {
    if (folderPath.length > 0) {
      const parentFolder = folderPath[folderPath.length - 2];
      const parentId = parentFolder ? parentFolder.id : null;
      navigateToFolder(parentId);
    }
  }, [folderPath, navigateToFolder]);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;

    try {
      setIsLoading(true);
      const newFolder = await databaseService.createFolder(
        newFolderName.trim(),
        currentFolderId
      );
      setFolders((prev) => [...prev, newFolder]);
      setSelectedFolderId(newFolder.id);
      setNewFolderName("");
      setShowNewFolderInput(false);
    } catch (error) {
      console.error("Failed to create folder:", error);
    } finally {
      setIsLoading(false);
    }
  }, [newFolderName, currentFolderId]);

  const handleSave = useCallback(() => {
    if (!requestName.trim()) {
      return;
    }

    onSave({
      name: requestName.trim(),
      description: description.trim() || undefined,
      folderId: selectedFolderId,
    });

    // Reset form
    setRequestName("");
    setDescription("");
    setSelectedFolderId(null);
    setSearchQuery("");
    setNewFolderName("");
    setShowNewFolderInput(false);
  }, [requestName, description, selectedFolderId, onSave]);

  const handleCancel = useCallback(() => {
    // Reset form
    setRequestName("");
    setDescription("");
    setSelectedFolderId(null);
    setSearchQuery("");
    setNewFolderName("");
    setShowNewFolderInput(false);
    setCurrentFolderId(null);
    setFolderPath([]);
    onClose();
  }, [onClose]);

  // Get current folder contents and filter based on search query
  const currentFolderContents = getCurrentFolderContents(
    folders,
    currentFolderId
  );
  const filteredFolders = currentFolderContents.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  // Build selected folder path for display
  const getSelectedFolderPath = useCallback(
    (folderId: string | null) => {
      if (!folderId) return "Root";

      const path: string[] = [];
      let currentId: string | null = folderId;

      while (currentId) {
        const folder = folders.find((f) => f.id === currentId);
        if (folder) {
          path.unshift(folder.name);
          currentId = folder.parent_id || null;
        } else {
          break;
        }
      }

      return path.join(" / ");
    },
    [folders]
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Request</DialogTitle>
        </DialogHeader>

        <FieldGroup>
          {/* Request Name Input */}
          <Field>
            <FieldLabel htmlFor="request-name">Request name</FieldLabel>
            <FieldContent>
              <Input
                id="request-name"
                placeholder="Enter request name"
                value={requestName}
                onChange={(e) => setRequestName(e.target.value)}
                autoFocus
              />
            </FieldContent>
          </Field>

          {/* Description Input */}
          <Field>
            <FieldLabel htmlFor="description">
              Description (Optional)
            </FieldLabel>
            <FieldContent>
              <Textarea
                id="description"
                placeholder="Enter description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </FieldContent>
          </Field>

          {/* Save To Collection Selection */}
          <Field>
            <FieldLabel>
              {/* Breadcrumb Navigation / Selected Folder Path */}
              <div className="flex items-center gap-2 text-sm">
                Save To
                {selectedFolder ? (
                  <div className="flex items-center gap-1 text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigateToFolder(null)}
                        className="hover:text-foreground transition-colors"
                      >
                        Root
                      </button>
                      {getSelectedFolderPath(selectedFolderId)
                        .split(" / ")
                        .map((folderName, index) => {
                          // Find the folder ID for this name in the path
                          const folderInPath = folderPath[index];
                          return (
                            <React.Fragment key={index}>
                              <ChevronRight className="h-3 w-3" />
                              <button
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
                      onClick={() => navigateToFolder(null)}
                      className="hover:text-muted-foreground transition-colors"
                    >
                      Root
                    </button>
                    {folderPath.map((folder, index) => (
                      <React.Fragment key={folder.id}>
                        <ChevronRight className="h-3 w-3" />
                        <button
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

          {/* New Folder Input (shown when New Folder button is clicked) */}
          {showNewFolderInput && (
            <Field>
              <FieldLabel htmlFor="new-folder-name">New Folder Name</FieldLabel>
              <FieldContent>
                <div className="text-xs text-muted-foreground mb-2">
                  Will be created in:{" "}
                  {currentFolderId
                    ? getSelectedFolderPath(currentFolderId)
                    : "Root"}
                </div>
                <div className="flex gap-2">
                  <Input
                    id="new-folder-name"
                    placeholder="Enter folder name"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleCreateFolder();
                      }
                      if (e.key === "Escape") {
                        setShowNewFolderInput(false);
                        setNewFolderName("");
                      }
                    }}
                  />
                  <Button
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim() || isLoading}
                    size="sm"
                  >
                    Create
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowNewFolderInput(false);
                      setNewFolderName("");
                    }}
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </FieldContent>
            </Field>
          )}
        </FieldGroup>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setShowNewFolderInput(true)}
            className="flex items-center gap-2"
          >
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!requestName.trim() || isLoading}
            >
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
