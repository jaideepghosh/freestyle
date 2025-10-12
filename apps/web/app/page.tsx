"use client";
import React from "react";
import { PlusIcon } from "lucide-react";
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
} from "@freestyle/ui";

export default function Freestyle() {
  const collections = [
    { name: "Simple Collection" },
    {
      name: "One Level Nested Collection One Level Nested Collection One Level Nested Collection",
      children: [{ name: "Child 1" }, { name: "Child 2" }],
    },
    {
      name: "Two Level Nested Collection",
      children: [
        {
          name: "Child 1",
          children: [{ name: "Grandchild 1" }, { name: "Grandchild 2" }],
        },
        {
          name: "Child 2",
          children: [{ name: "Grandchild 3" }, { name: "Grandchild 4" }],
        },
      ],
    },
    {
      name: "Three Level Nested Collection",
      children: [
        {
          name: "Child 1",
          children: [
            {
              name: "Grandchild 1",
              children: [
                { name: "Super Grandchild 1" },
                { name: "Super Grandchild 2" },
              ],
            },
            { name: "Grandchild 2" },
          ],
        },
        {
          name: "Child 2",
          children: [{ name: "Grandchild 3" }, { name: "Grandchild 4" }],
        },
      ],
    },
  ];

  return (
    <div className="flex h-screen bg-background text-sm">
      <CollectionTree collections={collections} />

      {/**
       * Dynamically add new tabs when clicked on the plus icon, also when clicked on any request from the CollectionTree, show the request in a new tab.
       */}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Tabs defaultValue="get-users">
          <div className="flex items-center gap-1 px-4 border-b">
            <TabsList className="h-10 p-0 bg-transparent">
              <TabsTrigger value="get-users">Get users</TabsTrigger>
              <TabsTrigger value="health">
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 text-xs py-0"
                >
                  GET
                </Badge>
                Health check
              </TabsTrigger>
              <TabsTrigger value="new">
                <PlusIcon />
              </TabsTrigger>
            </TabsList>
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

          <TabsContent value="get-users" className="flex-1 px-4">
            <Playground />
          </TabsContent>
          <TabsContent value="health" className="flex-1 px-4">
            <Playground />
          </TabsContent>
          <TabsContent value="new" className="flex-1 px-4">
            <Playground />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
