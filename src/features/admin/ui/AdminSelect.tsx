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
  ...props
}: React.ComponentProps<typeof Select>) {
  // Callers sometimes pass `value={x || undefined}`; that flips uncontrolled →
  // controlled. If a value prop or change handler is present, stay controlled.
  const controlled = value !== undefined || onValueChange != null;
  if (controlled) {
    return (
      <Select
        {...props}
        value={value ?? ""}
        onValueChange={onValueChange}
      />
    );
  }
  return <Select {...props} defaultValue={defaultValue} />;
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
