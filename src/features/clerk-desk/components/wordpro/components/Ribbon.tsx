import React, { useState } from "react";
import { cn } from "@/lib/utils";
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
import { useEditorInstance } from "@/contexts/EditorContext";

interface RibbonProps {
  className?: string;
  isMobile?: boolean;
  onFocusModeToggle?: () => void;
  isFocusMode?: boolean;
}

/**
 * Ribbon UI with 6+ tabs: Home, Insert, Layout, References, Review, View, (Table Tools)
 */
export function Ribbon({ className, isMobile = false, onFocusModeToggle, isFocusMode }: RibbonProps) {
  const [isOpen, setIsOpen] = useState(!isMobile);
  const [activeTab, setActiveTab] = useState("home");
  const editor = useEditorInstance();
  const isTableActive = editor?.isActive("table");

  if (isMobile) {
    return (
      <div className={cn("border-b bg-white", className)}>
        <div className="flex items-center justify-between p-3">
          <span className="text-sm font-black uppercase tracking-widest text-gray-500">Ribbon Tools</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-11 w-11 p-0 rounded-xl bg-gray-50 border border-gray-100"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {isOpen && (
          <div className="border-t animate-in slide-in-from-top-2 duration-200">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full justify-start rounded-none border-b bg-gray-50 p-0 overflow-x-auto scrollbar-hide flex-nowrap whitespace-nowrap">
                <TabsTrigger
                  value="home"
                  className="rounded-none border-b-2 border-transparent px-3 py-3 text-xs font-bold uppercase tracking-wide data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 flex-shrink-0"
                >
                  Home
                </TabsTrigger>
                <TabsTrigger
                  value="insert"
                  className="rounded-none border-b-2 border-transparent px-3 py-3 text-xs font-bold uppercase tracking-wide data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 flex-shrink-0"
                >
                  Insert
                </TabsTrigger>
                <TabsTrigger
                  value="layout"
                  className="rounded-none border-b-2 border-transparent px-3 py-3 text-xs font-bold uppercase tracking-wide data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 flex-shrink-0"
                >
                  Layout
                </TabsTrigger>
                <TabsTrigger
                  value="references"
                  className="rounded-none border-b-2 border-transparent px-3 py-3 text-xs font-bold uppercase tracking-wide data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 flex-shrink-0"
                >
                  Ref.
                </TabsTrigger>
                <TabsTrigger
                  value="review"
                  className="rounded-none border-b-2 border-transparent px-3 py-3 text-xs font-bold uppercase tracking-wide data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 flex-shrink-0"
                >
                  Review
                </TabsTrigger>
                <TabsTrigger
                  value="view"
                  className="rounded-none border-b-2 border-transparent px-3 py-3 text-xs font-bold uppercase tracking-wide data-[state=active]:border-blue-500 data-[state=active]:text-blue-600 flex-shrink-0"
                >
                  View
                </TabsTrigger>
                {isTableActive && (
                  <TabsTrigger
                    value="table"
                    className="rounded-none border-b-2 border-emerald-500 px-3 py-3 text-xs font-bold uppercase tracking-wide data-[state=active]:border-emerald-600 text-emerald-700 flex-shrink-0"
                  >
                    Table
                  </TabsTrigger>
                )}
              </TabsList>

              <div className="bg-white overflow-hidden">
                <TabsContent value="home" className="m-0 border-0 p-4">
                  <HomeTab isMobile={true} />
                </TabsContent>
                <TabsContent value="insert" className="m-0 border-0 p-4">
                  <InsertTab isMobile={true} />
                </TabsContent>
                <TabsContent value="layout" className="m-0 border-0 p-4">
                  <LayoutTab isMobile={true} />
                </TabsContent>
                <TabsContent value="references" className="m-0 border-0 p-4">
                  <ReferencesTab isMobile={true} />
                </TabsContent>
                <TabsContent value="review" className="m-0 border-0 p-4">
                  <ReviewTab isMobile={true} />
                </TabsContent>
                <TabsContent value="view" className="m-0 border-0 p-4">
                  <ViewTab isMobile={true} onFocusModeToggle={onFocusModeToggle} isFocusMode={isFocusMode} />
                </TabsContent>
                {isTableActive && (
                  <TabsContent value="table" className="m-0 border-0 p-4">
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

        <div className="border-t bg-gray-50 p-3 overflow-x-auto no-scrollbar">
          <TabsContent value="home" className="m-0 min-w-max">
            <HomeTab />
          </TabsContent>
          <TabsContent value="insert" className="m-0 min-w-max">
            <InsertTab />
          </TabsContent>
          <TabsContent value="layout" className="m-0 min-w-max">
            <LayoutTab />
          </TabsContent>
          <TabsContent value="references" className="m-0 min-w-max">
            <ReferencesTab />
          </TabsContent>
          <TabsContent value="review" className="m-0 min-w-max">
            <ReviewTab />
          </TabsContent>
          <TabsContent value="view" className="m-0 min-w-max">
            <ViewTab onFocusModeToggle={onFocusModeToggle} isFocusMode={isFocusMode} />
          </TabsContent>
          {isTableActive && (
            <TabsContent value="table" className="m-0 min-w-max">
              <TableTab />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
