"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  collectSelectItems,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  adminSelectContentClass,
  adminSelectItemClass,
  adminSelectTriggerClass,
} from "./styles";

function AdminSelect({
  value,
  defaultValue,
  onValueChange,
  children,
  items,
  ...props
}: React.ComponentProps<typeof Select>) {
  // `Select` only auto-derives its value->label map from direct `SelectItem`
  // children; going through `AdminSelectItem` hides those from that scan, so
  // it's redone here against the wrapped component.
  const resolvedItems = React.useMemo(() => {
    if (items) return items;
    const collected = collectSelectItems(children, AdminSelectItem);
    return collected.length > 0 ? collected : undefined;
  }, [children, items]);

  // Callers sometimes pass `value={x || undefined}`; that flips uncontrolled →
  // controlled. If a value prop or change handler is present, stay controlled.
  const controlled = value !== undefined || onValueChange != null;
  if (controlled) {
    return (
      <Select
        {...props}
        items={resolvedItems}
        value={value ?? ""}
        onValueChange={onValueChange}
      >
        {children}
      </Select>
    );
  }
  return (
    <Select {...props} items={resolvedItems} defaultValue={defaultValue}>
      {children}
    </Select>
  );
}

function AdminSelectTrigger({
  className,
  size: _size,
  ...props
}: React.ComponentProps<typeof SelectTrigger>) {
  return (
    <SelectTrigger
      className={cn(adminSelectTriggerClass, className)}
      {...props}
    />
  );
}

function AdminSelectContent({
  className,
  ...props
}: React.ComponentProps<typeof SelectContent>) {
  return (
    <SelectContent
      className={cn(adminSelectContentClass, className)}
      {...props}
    />
  );
}

function AdminSelectItem({
  className,
  ...props
}: React.ComponentProps<typeof SelectItem>) {
  return (
    <SelectItem className={cn(adminSelectItemClass, className)} {...props} />
  );
}

function AdminSelectValue(props: React.ComponentProps<typeof SelectValue>) {
  return <SelectValue {...props} />;
}

function AdminSelectGroup(props: React.ComponentProps<typeof SelectGroup>) {
  return <SelectGroup {...props} />;
}

function AdminSelectLabel(props: React.ComponentProps<typeof SelectLabel>) {
  return <SelectLabel {...props} />;
}

function AdminSelectSeparator(
  props: React.ComponentProps<typeof SelectSeparator>,
) {
  return <SelectSeparator {...props} />;
}

export {
  AdminSelect,
  AdminSelectTrigger,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectValue,
  AdminSelectGroup,
  AdminSelectLabel,
  AdminSelectSeparator,
};
