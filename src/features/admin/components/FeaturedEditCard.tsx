"use client";

import type { FeaturedProject } from "@/services/featured_projects";
import { FeaturedForm } from "./FeaturedForm";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = {
  item: FeaturedProject;
  pending: boolean;
  message: string | null;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  onDeleteClick: () => void;
};

export function FeaturedEditCard({
  item,
  pending,
  message,
  onSubmit,
  onDeleteClick,
}: Props) {
  return (
    <Card className="max-h-[calc(100vh-8rem)] gap-0 overflow-y-auto p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-lg font-medium">Edit featured</h2>
        <Button variant="destructive" size="sm" onClick={onDeleteClick}>
          Delete
        </Button>
      </div>
      <FeaturedForm
        key={item.id}
        item={item}
        onSubmit={onSubmit}
        pending={pending}
        message={message}
      />
      <Button
        className="mt-4 w-full"
        type="submit"
        form="featured-form"
        disabled={pending}
      >
        {pending ? "Saving…" : "Save"}
      </Button>
    </Card>
  );
}
