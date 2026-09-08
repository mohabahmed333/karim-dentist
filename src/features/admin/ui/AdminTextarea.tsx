"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { adminTextareaClass } from "./styles";

export function AdminTextarea({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      data-admin-field=""
      className={cn(adminTextareaClass, className)}
      {...props}
    />
  );
}
