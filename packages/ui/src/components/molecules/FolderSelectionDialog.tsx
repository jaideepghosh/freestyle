import React, { useState, useEffect, useCallback } from "react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  databaseService,
  Folder as FolderType,
} from "@freestyle/ui";
import { Folder, Plus, X } from "lucide-react";

interface FolderSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId: string | null, folderName: string) => void;
}

export const FolderSelectionDialog: React.FC<FolderSelectionDialogProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      setIsCreatingNew(false);
    } catch (error) {
      console.error("Failed to create folder:", error);
    } finally {
      setIsLoading(false);
    }
  }, [newFolderName]);

  const handleSelect = useCallback(() => {
    const selectedFolder = folders.find((f) => f.id === selectedFolderId);
    const folderName = selectedFolder ? selectedFolder.name : "Root";
    onSelect(selectedFolderId, folderName);
    onClose();
  }, [selectedFolderId, folders, onSelect, onClose]);

  const handleSaveToRoot = useCallback(() => {
    onSelect(null, "Root");
    onClose();
  }, [onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Select Folder</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Existing folders */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Choose existing folder:
            </label>
            <Select
              value={selectedFolderId || "root"}
              onValueChange={(value) => {
                setSelectedFolderId(value === "root" ? null : value);
                setIsCreatingNew(false);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a folder" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Root (No folder)</SelectItem>
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={folder.id}>
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      {folder.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Create new folder */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCreatingNew(!isCreatingNew)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Create New Folder
              </Button>
            </div>

            {isCreatingNew && (
              <div className="space-y-2">
                <Input
                  placeholder="Enter folder name"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleCreateFolder();
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateFolder}
                    disabled={!newFolderName.trim() || isLoading}
                  >
                    Create
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setNewFolderName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveToRoot} variant="secondary">
            Save to Root
          </Button>
          <Button
            onClick={handleSelect}
            disabled={selectedFolderId === undefined && !isCreatingNew}
          >
            Select Folder
          </Button>
        </div>
      </div>
    </div>
  );
};
