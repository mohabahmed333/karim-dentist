"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AddNodePayload, CanvasNode, MediaFile } from "./canvas.types";
import { AddNodeStepper } from "./AddNodeStepper";
import { ParentNodeSelect } from "./ParentNodeSelect";
import { ShapeDataFields } from "./ShapeDataFields";
import { ShapeExamplePreview } from "./ShapeExamplePreview";
import { ShapePickerPanel } from "./ShapePickerPanel";
import { CORE_SHAPES } from "./shapeRegistry";
import { dataFromForm, formFromShape, type ShapeFormState } from "./shapeForm";

type Props = {
  open: boolean;
  parentId: string | null;
  nodes: CanvasNode[];
  onClose: () => void;
  onCreate: (payload: AddNodePayload) => void;
};

export function AddNodeDrawer({ open, parentId, nodes, onClose, onCreate }: Props) {
  const [step, setStep] = useState(0);
  const [shapeType, setShapeType] = useState("SHAPE_05");
  const [parent, setParent] = useState<string | null>(parentId);
  const [form, setForm] = useState<ShapeFormState>(() => formFromShape("SHAPE_05"));
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setParent(parentId);
    const initial = CORE_SHAPES[4];
    setShapeType(initial.key);
    setForm(formFromShape(initial.key));
    setMediaFiles([]);
  }, [open, parentId]);

  const previewData = useMemo(() => {
    const base = dataFromForm(shapeType, form);
    return shapeType === "SHAPE_03" ? { ...base, mediaFiles } : base;
  }, [form, mediaFiles, shapeType]);

  const pickShape = (key: string, defaultTitle: string) => {
    setShapeType(key);
    setForm({ ...formFromShape(key), title: defaultTitle });
  };

  const canNext = step === 0 ? true : step === 1 ? Boolean(shapeType) : form.title.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-3xl border-none bg-[#EBEAE5] p-0 sm:max-w-2xl">
        <div className="border-b border-black/5 bg-white px-5 py-4">
          <DialogHeader>
            <DialogTitle className="text-[#111111]">Add graph node</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <AddNodeStepper step={step} />
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          {step === 0 ? (
            <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
              <Label className="text-[12px] font-semibold text-[#111111]">Connect to parent</Label>
              <p className="text-[11px] text-[#111111]/55">
                Choose where this node branches from. Lines draw automatically from parent to child.
              </p>
              <ParentNodeSelect value={parent} nodes={nodes} onChange={setParent} />
            </div>
          ) : null}

          {step === 1 ? (
            <ShapePickerPanel shapeType={shapeType} previewTitle={form.title} onPick={pickShape} />
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
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
                  shapeType={shapeType}
                  form={form}
                  onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
                  mediaFiles={mediaFiles}
                  onMediaFiles={setMediaFiles}
                />
              </div>
              <div className="flex justify-center rounded-2xl border border-[#E2F163]/40 bg-white p-4">
                <ShapeExamplePreview
                  shapeType={shapeType}
                  title={form.title}
                  data={previewData}
                  scale={0.5}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between border-t border-black/5 bg-white px-5 py-4">
          <Button
            type="button"
            variant="ghost"
            className="rounded-full"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          {step < 2 ? (
            <Button
              type="button"
              className="rounded-full bg-[#111111] px-6"
              disabled={!canNext}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              className="rounded-full bg-[#111111] px-6"
              disabled={!canNext}
              onClick={() =>
                onCreate({
                  parentId: parent,
                  shapeType,
                  title: form.title.trim(),
                  data: previewData,
                })
              }
            >
              Create & connect
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
