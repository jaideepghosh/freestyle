"use client";
import React, { useState, useEffect, useRef } from "react";
import { PlusIcon, X } from "lucide-react";
import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CollectionTree,
  Playground,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  databaseService,
  Folder,
  Request,
  Input,
} from "@freestyle/ui";

interface TabData {
  id: string;
  name: string;
  request?: Request;
  isNew?: boolean;
}

export default function Freestyle() {
  const [collections, setCollections] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [activeTab, setActiveTab] = useState("");
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      const folders = await databaseService.getFolders();
      setCollections(folders);
    } catch (error) {
      console.error("Failed to load collections:", error);
      setCollections([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
    // Create initial tab if none exist
    if (tabs.length === 0) {
      createNewTab();
    }
  }, []);

  // Create initial tab when tabs array is empty
  useEffect(() => {
    if (tabs.length === 0 && !isLoading) {
      createNewTab();
    }
  }, [tabs.length, isLoading]);

  const createNewTab = () => {
    const newTabId = `new-${Date.now()}`;
    const newTab: TabData = {
      id: newTabId,
      name: "New Request",
      isNew: true,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTab(newTabId);
  };

  const openRequestInTab = (request: Request) => {
    // Check if request is already open in a tab
    const existingTab = tabs.find((tab) => tab.request?.id === request.id);
    if (existingTab) {
      setActiveTab(existingTab.id);
      return;
    }

    // Create new tab for the request
    const newTabId = `request-${request.id}`;
    const newTab: TabData = {
      id: newTabId,
      name: request.name,
      request,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTab(newTabId);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length <= 1) return; // Don't close the last tab

    setTabs((prev) => prev.filter((tab) => tab.id !== tabId));

    // If we're closing the active tab, switch to another tab
    if (activeTab === tabId) {
      const remainingTabs = tabs.filter((tab) => tab.id !== tabId);
      if (remainingTabs.length > 0) {
        const lastTab = remainingTabs[remainingTabs.length - 1];
        if (lastTab) {
          setActiveTab(lastTab.id);
        }
      }
    }
  };

  const startRenaming = (tabId: string, currentName: string) => {
    setRenamingTabId(tabId);
    setRenameValue(currentName);
  };

  const cancelRenaming = () => {
    setRenamingTabId(null);
    setRenameValue("");
  };

  const saveRename = async (tabId: string) => {
    if (!renameValue.trim()) {
      cancelRenaming();
      return;
    }

    try {
      const tab = tabs.find((t) => t.id === tabId);
      if (!tab) return;

      // Update tab name in state
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId ? { ...t, name: renameValue.trim() } : t
        )
      );

      // If this tab has a saved request, update it in the database
      if (tab.request) {
        await databaseService.updateRequest(tab.request.id, {
          name: renameValue.trim(),
        });
        // Reload collections to reflect the change
        loadCollections();
      }

      cancelRenaming();
    } catch (error) {
      console.error("Failed to rename request:", error);
      // Revert the tab name on error
      setTabs((prev) =>
        prev.map((t) =>
          t.id === tabId ? { ...t, name: t.name || "Untitled" } : t
        )
      );
      cancelRenaming();
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent, tabId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveRename(tabId);
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelRenaming();
    }
  };

  // Focus input when renaming starts
  useEffect(() => {
    if (renamingTabId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingTabId]);

  return (
    <div className="flex h-screen bg-background text-sm">
      <div className="w-80 border-r bg-gray-50/50">
        {isLoading ? (
          <div className="p-4 text-sm text-gray-500">
            Loading collections...
          </div>
        ) : collections.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">
            No collections yet. Save a request to create your first collection!
          </div>
        ) : (
          <CollectionTree
            collections={collections}
            onRequestClick={openRequestInTab}
          />
        )}
      </div>

      {/**
       * Dynamically add new tabs when clicked on the plus icon, also when clicked on any request from the CollectionTree, show the request in a new tab.
       */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center gap-1 px-4 border-b">
            <TabsList className="h-10 p-0 bg-transparent">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="group flex items-center gap-2 relative"
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    startRenaming(tab.id, tab.name);
                  }}
                >
                  {tab.request && (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700 text-xs py-0"
                    >
                      {tab.request.method}
                    </Badge>
                  )}
                  {renamingTabId === tab.id ? (
                    <Input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => handleRenameKeyDown(e, tab.id)}
                      onBlur={() => saveRename(tab.id)}
                      className="flex-1 h-6 text-xs border-none bg-transparent p-0 focus:ring-0 focus:border-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1">{tab.name}</span>
                  )}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-1 hover:bg-gray-200 rounded cursor-pointer"
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        closeTab(tab.id);
                      }
                    }}
                    aria-label={`Close ${tab.name}`}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
            <button
              onClick={createNewTab}
              className="ml-2 p-2 hover:bg-gray-100 rounded transition-colors"
              aria-label="Create new tab"
            >
              <PlusIcon className="h-4 w-4" />
            </button>
            <div className="ml-auto">
              <Select defaultValue="payable">
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="payable">Payable Local</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="staging">Staging</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="flex-1 px-4">
              <Playground
                initialRequest={tab.request}
                onCollectionSaved={loadCollections}
              />
            </TabsContent>
          ))}
        </Tabs>

        {/* <div className="flex-1 px-4">
          <Playground onCollectionSaved={loadCollections} />
        </div> */}
      </div>
    </div>
  );
}
