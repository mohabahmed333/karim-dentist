"use client";

import type { Service } from "@/services/services";
import { ServicesForm } from "./ServicesForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  item: Service;
  pending: boolean;
  message: string | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDeleteClick: () => void;
};

export function ServicesEditCard({
  item,
  pending,
  message,
  onSubmit,
  onDeleteClick,
}: Props) {
  return (
    <Card className="gap-0 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Edit service</h2>
        <Button variant="destructive" size="sm" onClick={onDeleteClick}>
          Delete
        </Button>
      </div>
      <ServicesForm
        key={item.id}
        item={item}
        onSubmit={onSubmit}
        pending={pending}
        message={message}
      />
      <Button
        className="mt-4 w-full"
        type="submit"
        form="services-form"
        disabled={pending}
      >
        {pending ? "Saving…" : "Save"}
      </Button>
    </Card>
  );
}
