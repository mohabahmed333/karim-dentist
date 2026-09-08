"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { adminFieldButtonClass } from "./styles";

/** Chrome trigger for filters / date pickers — matches admin fields. */
export function AdminFieldButton({
  className,
  type = "button",
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type={type}
      data-admin-field-button=""
      className={cn(adminFieldButtonClass, className)}
      {...props}
    />
  );
}
