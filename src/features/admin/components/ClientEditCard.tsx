"use client";

import type { Client } from "@/services/clients";
import { ClientForm } from "./ClientForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  item: Client;
  pending: boolean;
  message: string | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDeleteClick: () => void;
};

export function ClientEditCard({
  item,
  pending,
  message,
  onSubmit,
  onDeleteClick,
}: Props) {
  return (
    <Card className="gap-0 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Edit client</h2>
        <Button variant="destructive" size="sm" onClick={onDeleteClick}>
          Delete
        </Button>
      </div>
      <ClientForm
        key={item.id}
        item={item}
        onSubmit={onSubmit}
        pending={pending}
        message={message}
      />
      <Button
        className="mt-4 w-full"
        type="submit"
        form="client-form"
        disabled={pending}
      >
        {pending ? "Saving…" : "Save"}
      </Button>
    </Card>
  );
}
