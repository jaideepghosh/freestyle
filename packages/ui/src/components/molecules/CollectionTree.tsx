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
import { Button, ScrollArea, databaseService, Request } from "@freestyle/ui";

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
  useEffect(() => {
    if (level === 0 && !expanded) {
      toggle();
    }
  }, []);

  return (
    <div className={`text-sm ${level === 0 ? "border-b" : ""}`}>
      <div className="group relative">
        <div
          className={`flex items-center w-full justify-start gap-2 rounded-none h-auto py-2 px-2 hover:bg-gray-100/90`}
          onClick={toggle}
          style={{ paddingLeft: 8 + level * 8 }} // Indent by level
        >
          {hasChildren || hasRequests || loadingRequests ? (
            <ChevronRight
              className={`h-4 w-4 text-muted-foreground transform transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
            />
          ) : (
            <span style={{ width: 0, display: "inline-block" }} />
          )}

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

export const CollectionTree: React.FC<CollectionTreeProps> = ({
  collections,
  onRequestClick,
}) => {
  return (
    <div className="w-80 border-r flex flex-col">
      {/* CollectionTree Header */}
      <div className="px-4 py-2 border-b">
        <div className="flex items-center">
          <h3 className="font-bold">Collections</h3>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto"
            title="Add New Collection"
          >
            <PlusIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" title="Import Request">
            <Upload className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Collections List */}
      <ScrollArea className="flex-1">
        <div>
          {collections.map((item, idx) => (
            <CollectionItem
              key={idx}
              item={item}
              onRequestClick={onRequestClick}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
