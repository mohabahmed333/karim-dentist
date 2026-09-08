"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { adminFieldClass } from "./styles";

/** Native `<select>` styled like other admin fields. */
export function AdminNativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      data-admin-field=""
      className={cn(adminFieldClass, "appearance-none pe-8", className)}
      {...props}
    >
      {children}
    </select>
  );
}
