"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root ref={ref} className={cn("", className)} {...props} />
));
Tabs.displayName = TabsPrimitive.Root.displayName;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List ref={ref} className={cn("flex", className)} {...props} />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTab = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Tab>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Tab>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Tab
    ref={ref}
    className={cn(
      "svg-outline-sm relative px-2 py-1 aria-selected:bg-foreground aria-selected:text-background",
      className,
    )}
    {...props}
  />
));
TabsTab.displayName = TabsPrimitive.Tab.displayName;

const TabsPanel = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Panel>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Panel>
>(({ className, children, ...props }, ref) => (
  <TabsPrimitive.Panel ref={ref} className={cn("svg-outline relative", className)} {...props}>
    {children}
  </TabsPrimitive.Panel>
));
TabsPanel.displayName = TabsPrimitive.Panel.displayName;

const TabsIndicator = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Indicator ref={ref} className={cn("", className)} {...props} />
));
TabsIndicator.displayName = TabsPrimitive.Indicator.displayName;

export { Tabs, TabsList, TabsTab, TabsPanel, TabsIndicator };
