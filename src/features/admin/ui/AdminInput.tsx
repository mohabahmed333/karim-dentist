"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { adminFieldClass } from "./styles";

export function AdminInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return <Input data-admin-field="" className={cn(adminFieldClass, className)} {...props} />;
}
