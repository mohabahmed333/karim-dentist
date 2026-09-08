"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  adminMenuItemClass,
  adminMenuLabelClass,
  adminMenuPanelClass,
  adminMenuSeparatorClass,
} from "./styles";

function AdminDropdownMenu(props: React.ComponentProps<typeof DropdownMenu>) {
  return <DropdownMenu {...props} />;
}

function AdminDropdownMenuTrigger(
  props: React.ComponentProps<typeof DropdownMenuTrigger>,
) {
  return <DropdownMenuTrigger {...props} />;
}

function AdminDropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof DropdownMenuContent>) {
  return (
    <DropdownMenuContent
      sideOffset={sideOffset}
      className={cn(adminMenuPanelClass, className)}
      {...props}
    />
  );
}

function AdminDropdownMenuItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuItem>) {
  return (
    <DropdownMenuItem className={cn(adminMenuItemClass, className)} {...props} />
  );
}

function AdminDropdownMenuCheckboxItem({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuCheckboxItem>) {
  return (
    <DropdownMenuCheckboxItem
      className={cn(adminMenuItemClass, "pr-8", className)}
      {...props}
    />
  );
}

function AdminDropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuSeparator>) {
  return (
    <DropdownMenuSeparator
      className={cn(adminMenuSeparatorClass, className)}
      {...props}
    />
  );
}

function AdminDropdownMenuGroup(
  props: React.ComponentProps<typeof DropdownMenuGroup>,
) {
  return <DropdownMenuGroup {...props} />;
}

function AdminDropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof DropdownMenuLabel>) {
  return (
    <DropdownMenuLabel
      className={cn(adminMenuLabelClass, className)}
      {...props}
    />
  );
}

export {
  AdminDropdownMenu,
  AdminDropdownMenuTrigger,
  AdminDropdownMenuContent,
  AdminDropdownMenuGroup,
  AdminDropdownMenuItem,
  AdminDropdownMenuCheckboxItem,
  AdminDropdownMenuSeparator,
  AdminDropdownMenuLabel,
};
