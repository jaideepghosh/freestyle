"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronRight,
  PlusIcon,
  EllipsisVertical,
  Star,
  Upload,
  Folder,
  FileText,
} from "lucide-react";
import {
  Button,
  ScrollArea,
  databaseService,
  Request,
  ImportRequestDialog,
} from "@freestyle/ui";

interface Collection {
  id: string;
  name: string;
  parent_id?: string | null;
  children?: Collection[];
  requests?: Request[];
}

interface CollectionTreeProps {
  collections: Collection[];
  onRequestClick?: (request: Request) => void;
}

// Recursive component to render each item and its children
const CollectionItem = ({
  item,
  level = 0,
  onRequestClick,
}: {
  item: Collection;
  level?: number;
  onRequestClick?: (request: Request) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const hasChildren = item.children && item.children.length > 0;
  const hasRequests = requests.length > 0;

  const toggle = async () => {
    if (!expanded && !hasRequests) {
      // Load requests when expanding for the first time
      setLoadingRequests(true);
      try {
        const folderRequests = await databaseService.getRequests(item.id);
        setRequests(folderRequests);
      } catch (error) {
        console.error("Failed to load requests:", error);
      } finally {
        setLoadingRequests(false);
      }
    }
    setExpanded((prev) => !prev);
  };

  // Load requests on mount if this is a root-level collection
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (level === 0 && !expanded) {
      toggle();
    }
  }, []);

  return (
    <div className={`text-sm ${level === 0 ? "border-b" : ""}`}>
      <div className="group relative">
        <div
          className={`flex items-center w-full justify-start gap-2 rounded-none h-auto py-2 px-2 hover:bg-gray-100/90 cursor-pointer`}
          onClick={toggle}
          style={{ paddingLeft: 8 + level * 8 }} // Indent by level
        >
          <ChevronRight
            className={`h-4 w-4 text-muted-foreground transform transition-transform duration-200 ${
              expanded ? "rotate-90" : ""
            }`}
          />

          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-left font-normal">
            {item.name.slice(0, 30)}
            {item.name.length > 30 ? "..." : ""}
          </span>

          {/* Hover actions */}
          <div
            className={`absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity`}
          >
            {level === 0 ? (
              <div className="bg-gray-100/90">
                <Button variant="ghost" size="sm" aria-label="Add">
                  <PlusIcon className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" aria-label="Star">
                  <Star className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" aria-label="More options">
                  <EllipsisVertical className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="bg-gray-100/90" aria-label="More options">
                <EllipsisVertical className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="space-y-0.5 py-1">
          {/* Render child collections */}
          {hasChildren && item.children && (
            <>
              {item.children.map((child, idx) => (
                <CollectionItem
                  key={idx}
                  item={child}
                  level={level + 1}
                  onRequestClick={onRequestClick}
                />
              ))}
            </>
          )}

          {/* Render requests */}
          {loadingRequests && (
            <div className="px-4 py-2 text-xs text-gray-500">
              Loading requests...
            </div>
          )}

          {!loadingRequests && requests.length > 0 && (
            <div className="space-y-0.5">
              {requests.map((request, idx) => (
                <div
                  key={request.id}
                  className="flex items-center gap-2 py-1 px-2 hover:bg-gray-100/50 cursor-pointer"
                  style={{ paddingLeft: 8 + (level + 1) * 8 }}
                  onClick={() => onRequestClick?.(request)}
                >
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-gray-700 truncate">
                    {request.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {request.method}
                  </span>
                </div>
              ))}
            </div>
          )}

          {!loadingRequests && requests.length === 0 && !hasChildren && (
            <div className="px-4 py-2 text-xs text-gray-500">
              No requests saved yet
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to build tree structure from flat collection list
const buildCollectionTree = (collections: Collection[]): Collection[] => {
  const collectionMap = new Map<string, Collection>();
  const rootCollections: Collection[] = [];

  // First pass: create a map of all collections
  collections.forEach((collection) => {
    collectionMap.set(collection.id, { ...collection, children: [] });
  });

  // Second pass: build the tree structure
  collections.forEach((collection) => {
    const collectionWithChildren = collectionMap.get(collection.id)!;

    if (collection.parent_id && collectionMap.has(collection.parent_id)) {
      // This is a child collection
      const parent = collectionMap.get(collection.parent_id)!;
      if (!parent.children) {
        parent.children = [];
      }
      parent.children.push(collectionWithChildren);
    } else {
      // This is a root collection
      rootCollections.push(collectionWithChildren);
    }
  });

  return rootCollections;
};

export const CollectionTree: React.FC<CollectionTreeProps> = ({
  collections,
  onRequestClick,
}) => {
  const [isImportOpen, setIsImportOpen] = useState(false);
  const treeCollections = buildCollectionTree(collections);

  return (
    <div className="w-80 border-r flex flex-col">
      {/* CollectionTree Header */}
      <div className="px-4 py-2 border-b">
        <div className="flex items-center">
          <h3 className="font-bold">Collections</h3>
          <Button
            variant="ghost"
            size="icon"
            title="Import Request"
            className="ml-auto"
            onClick={() => setIsImportOpen(true)}
          >
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Collections List */}
      <ScrollArea className="flex-1">
        <div>
          {treeCollections.map((item, idx) => (
            <CollectionItem
              key={idx}
              item={item}
              onRequestClick={onRequestClick}
            />
          ))}
        </div>
      </ScrollArea>
      <ImportRequestDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportWithoutSaving={onRequestClick}
      />
    </div>
  );
};
