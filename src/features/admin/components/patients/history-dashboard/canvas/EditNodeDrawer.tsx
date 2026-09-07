"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CanvasNode, MediaFile } from "./canvas.types";
import { ShapeDataFields } from "./ShapeDataFields";
import { ShapeExamplePreview } from "./ShapeExamplePreview";
import { dataFromForm, formFromData, type ShapeFormState } from "./shapeForm";

type Props = {
  open: boolean;
  node: CanvasNode | null;
  onClose: () => void;
  onSave: (payload: { title: string; data: CanvasNode["data"] }) => void;
};

export function EditNodeDrawer({ open, node, onClose, onSave }: Props) {
  const [form, setForm] = useState<ShapeFormState>(() => formFromData("SHAPE_05", undefined));
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  useEffect(() => {
    if (!open || !node) return;
    setForm(formFromData(node.shapeType, node.data));
    setMediaFiles(node.data?.mediaFiles ?? []);
  }, [open, node?.id, node?.shapeType]);

  const previewData = useMemo(() => {
    if (!node) return undefined;
    const base = dataFromForm(node.shapeType, form, node.data);
    return node.shapeType === "SHAPE_03" ? { ...base, mediaFiles } : base;
  }, [form, mediaFiles, node]);

  const canSave = Boolean(form.title.trim().length > 0);

  if (!node) return null;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-none bg-[#EBEAE5] p-0 sm:max-w-2xl">
        <div className="border-b border-black/5 bg-white px-5 py-4">
          <DialogHeader>
            <DialogTitle className="text-[#111111]">Edit node</DialogTitle>
          </DialogHeader>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <Label className="text-[12px] font-semibold">Node title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="mt-2 rounded-xl"
            />
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <Label className="mb-3 block text-[12px] font-semibold">Shape-specific fields</Label>
            <ShapeDataFields
              shapeType={node.shapeType}
              form={form}
              onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
              mediaFiles={mediaFiles}
              onMediaFiles={setMediaFiles}
            />
          </div>

          <div className="flex justify-center rounded-2xl border border-[#E2F163]/40 bg-white p-4">
            <ShapeExamplePreview
              shapeType={node.shapeType}
              title={form.title}
              data={previewData}
              scale={0.5}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-black/5 bg-white px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="rounded-full bg-[#111111] px-6"
            disabled={!canSave}
            onClick={() => onSave({ title: form.title.trim(), data: previewData })}
          >
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

