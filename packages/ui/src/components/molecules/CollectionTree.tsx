import React, { useState } from "react";
import { ChevronRight, PlusIcon, EllipsisVertical, Star } from "lucide-react";
import { Button, ScrollArea } from "@freestyle/ui";

interface Collection {
  name: string;
  children?: Collection[];
}

interface CollectionTreeProps {
  collections: Collection[];
}

// Recursive component to render each item and its children
const CollectionItem = ({
  item,
  level = 0,
}: {
  item: Collection;
  level?: number;
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = item.children && item.children.length > 0;

  const toggle = () => {
    if (hasChildren) setExpanded((prev) => !prev);
  };

  return (
    <div className={`text-sm ${level === 0 ? "border-b" : ""}`}>
      <div className="group relative">
        <div
          className={`flex items-center w-full justify-start gap-2 rounded-none h-auto py-2 px-2 hover:bg-gray-100/90`}
          onClick={toggle}
          style={{ paddingLeft: 8 + level * 8 }} // Indent by level
        >
          {hasChildren ? (
            <ChevronRight
              className={`h-4 w-4 text-muted-foreground transform transition-transform ${
                expanded ? "rotate-90" : ""
              }`}
            />
          ) : (
            <span style={{ width: 0, display: "inline-block" }} />
          )}

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

      {hasChildren && expanded && item.children && (
        <div className="space-y-0.5 py-1">
          {item.children.map((child, idx) => (
            <CollectionItem key={idx} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const CollectionTree: React.FC<CollectionTreeProps> = ({ collections }) => {
  return (
    <div className="w-80 border-r flex flex-col">
      {/* CollectionTree Header */}
      <div className="px-4 py-2 border-b bg-gray-100">
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
        </div>
      </div>

      {/* Collections List */}
      <ScrollArea className="flex-1">
        <div>
          {collections.map((item, idx) => (
            <CollectionItem key={idx} item={item} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CollectionTree;
