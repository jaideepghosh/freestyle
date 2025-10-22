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
} from "@freestyle/ui";
import { FolderPlus } from "lucide-react";

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

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;

    try {
      setIsLoading(true);
      const newFolder = await databaseService.createFolder(
        newFolderName.trim()
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
  }, [newFolderName]);

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
    onClose();
  }, [onClose]);

  // Filter folders based on search query
  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedFolder = folders.find((f) => f.id === selectedFolderId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Request Name Input */}
          <div className="space-y-2">
            <label htmlFor="request-name" className="text-sm font-medium">
              Request name
            </label>
            <Input
              id="request-name"
              placeholder="Enter request name"
              value={requestName}
              onChange={(e) => setRequestName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description (Optional)
            </label>
            <Textarea
              id="description"
              placeholder="Enter description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Save To Collection Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Save To</label>
            <Command className="border rounded-md">
              <CommandInput
                placeholder="Search collections..."
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
              <CommandList className="max-h-48">
                <CommandEmpty>No collections found.</CommandEmpty>
                {filteredFolders.map((folder) => (
                  <CommandItem
                    key={folder.id}
                    value={folder.name}
                    onSelect={() => setSelectedFolderId(folder.id)}
                    className="flex items-center justify-between"
                  >
                    <span>{folder.name}</span>
                    {selectedFolderId === folder.id && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </CommandItem>
                ))}
              </CommandList>
            </Command>

            {/* Show selected folder */}
            {selectedFolder && (
              <div className="text-sm text-muted-foreground">
                Selected: {selectedFolder.name}
              </div>
            )}
          </div>

          {/* New Folder Input (shown when New Folder button is clicked) */}
          {showNewFolderInput && (
            <div className="space-y-2">
              <label htmlFor="new-folder-name" className="text-sm font-medium">
                New Folder Name
              </label>
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
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setShowNewFolderInput(true)}
            className="flex items-center gap-2"
          >
            <FolderPlus className="h-4 w-4" />
            New Folder
          </Button>
          <div className="flex gap-2">
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
