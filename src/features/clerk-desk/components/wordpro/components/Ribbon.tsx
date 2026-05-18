import React, { useState } from "react";
import { cn } from "../lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { HomeTab } from "./ribbon-tabs/HomeTab";
import { InsertTab } from "./ribbon-tabs/InsertTab";
import { LayoutTab } from "./ribbon-tabs/LayoutTab";
import { ReferencesTab } from "./ribbon-tabs/ReferencesTab";
import { ReviewTab } from "./ribbon-tabs/ReviewTab";
import { ViewTab } from "./ribbon-tabs/ViewTab";
import { TableTab } from "./ribbon-tabs/TableTab";
import { Menu, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { useEditorContext } from "../contexts/EditorContext";

interface RibbonProps {
  className?: string;
  isMobile?: boolean;
  onFocusModeToggle?: () => void;
}

/**
 * Ribbon UI with 6+ tabs: Home, Insert, Layout, References, Review, View, (Table Tools)
 */
export function Ribbon({ className, isMobile = false }: RibbonProps) {
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState("home");
  const { editor } = useEditorContext();
  const isTableActive = editor?.isActive("table");

  if (isMobile) {
    return (
      <div className={cn("border-b bg-white", className)}>
        <div className="flex items-center justify-between p-2">
          <span className="text-sm font-semibold">Ribbon</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-8 w-8 p-0"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {isOpen && (
          <div className="border-t">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full justify-start rounded-none border-b bg-gray-50 p-0 overflow-x-auto custom-scrollbar">
                <TabsTrigger
                  value="home"
                  className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-500"
                >
                  Home
                </TabsTrigger>
                <TabsTrigger
                  value="insert"
                  className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-500"
                >
                  Insert
                </TabsTrigger>
                <TabsTrigger
                  value="layout"
                  className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-500"
                >
                  Layout
                </TabsTrigger>
                <TabsTrigger
                  value="references"
                  className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-500"
                >
                  References
                </TabsTrigger>
                <TabsTrigger
                  value="review"
                  className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-500"
                >
                  Review
                </TabsTrigger>
                <TabsTrigger
                  value="view"
                  className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-blue-500"
                >
                  View
                </TabsTrigger>
                {isTableActive && (
                  <TabsTrigger
                    value="table"
                    className="rounded-none border-b-2 border-emerald-500 px-4 py-2 data-[state=active]:border-emerald-600 text-emerald-700"
                  >
                    Table
                  </TabsTrigger>
                )}
              </TabsList>

              <div className="overflow-x-auto">
                <TabsContent value="home" className="m-0 border-0 p-2">
                  <HomeTab isMobile={true} />
                </TabsContent>
                <TabsContent value="insert" className="m-0 border-0 p-2">
                  <InsertTab isMobile={true} />
                </TabsContent>
                <TabsContent value="layout" className="m-0 border-0 p-2">
                  <LayoutTab isMobile={true} />
                </TabsContent>
                <TabsContent value="references" className="m-0 border-0 p-2">
                  <ReferencesTab isMobile={true} />
                </TabsContent>
                <TabsContent value="review" className="m-0 border-0 p-2">
                  <ReviewTab isMobile={true} />
                </TabsContent>
                <TabsContent value="view" className="m-0 border-0 p-2">
                  <ViewTab isMobile={true} onFocusModeToggle={onFocusModeToggle} />
                </TabsContent>
                {isTableActive && (
                  <TabsContent value="table" className="m-0 border-0 p-2">
                    <TableTab />
                  </TabsContent>
                )}
              </div>
            </Tabs>
          </div>
        )}
      </div>
    );
  }

  // Desktop ribbon
  return (
    <div className={cn("border-b bg-white", className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-gray-50 p-0">
          <TabsTrigger
            value="home"
            className="rounded-none border-b-2 border-transparent px-6 py-3 font-semibold data-[state=active]:border-blue-500"
          >
            Home
          </TabsTrigger>
          <TabsTrigger
            value="insert"
            className="rounded-none border-b-2 border-transparent px-6 py-3 font-semibold data-[state=active]:border-blue-500"
          >
            Insert
          </TabsTrigger>
          <TabsTrigger
            value="layout"
            className="rounded-none border-b-2 border-transparent px-6 py-3 font-semibold data-[state=active]:border-blue-500"
          >
            Layout
          </TabsTrigger>
          <TabsTrigger
            value="references"
            className="rounded-none border-b-2 border-transparent px-6 py-3 font-semibold data-[state=active]:border-blue-500"
          >
            References
          </TabsTrigger>
          <TabsTrigger
            value="review"
            className="rounded-none border-b-2 border-transparent px-6 py-3 font-semibold data-[state=active]:border-blue-500"
          >
            Review
          </TabsTrigger>
          <TabsTrigger
            value="view"
            className="rounded-none border-b-2 border-transparent px-6 py-3 font-semibold data-[state=active]:border-blue-500"
          >
            View
          </TabsTrigger>
          {isTableActive && (
            <TabsTrigger
              value="table"
              className="rounded-none border-b-2 border-emerald-500 px-6 py-3 font-semibold data-[state=active]:border-emerald-600 text-emerald-700 bg-emerald-50/50"
            >
              Table Tools
            </TabsTrigger>
          )}
        </TabsList>

        <div className="border-t bg-gray-50 p-3">
          <TabsContent value="home" className="m-0">
            <HomeTab />
          </TabsContent>
          <TabsContent value="insert" className="m-0">
            <InsertTab />
          </TabsContent>
          <TabsContent value="layout" className="m-0">
            <LayoutTab />
          </TabsContent>
          <TabsContent value="references" className="m-0">
            <ReferencesTab />
          </TabsContent>
          <TabsContent value="review" className="m-0">
            <ReviewTab />
          </TabsContent>
          <TabsContent value="view" className="m-0">
            <ViewTab onFocusModeToggle={onFocusModeToggle} />
          </TabsContent>
          {isTableActive && (
            <TabsContent value="table" className="m-0">
              <TableTab />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
