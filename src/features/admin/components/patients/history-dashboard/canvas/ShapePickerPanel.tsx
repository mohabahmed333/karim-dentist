"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CORE_SHAPES, SHAPE_REGISTRY, getShapeDefinition, isSchemaShape } from "./shapeRegistry";
import { ShapeExamplePreview } from "./ShapeExamplePreview";

const FEATURED = ["SHAPE_009", "SHAPE_015", "SHAPE_025", "SHAPE_050", "SHAPE_100"];

type Props = {
  shapeType: string;
  previewTitle: string;
  onPick: (key: string, defaultTitle: string) => void;
};

export function ShapePickerPanel({ shapeType, previewTitle, onPick }: Props) {
  const [tab, setTab] = useState<"core" | "schema">(
    isSchemaShape(shapeType) ? "schema" : "core",
  );
  const selected = getShapeDefinition(shapeType);
  const schemaOptions = SHAPE_REGISTRY.filter((shape) => shape.category === "schema");

  return (
    <div className="space-y-3">
      <div className="flex rounded-2xl bg-[#111111]/5 p-1">
        {(["core", "schema"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-xl py-2 text-[11px] font-medium transition ${
              tab === key ? "bg-white text-[#111111] shadow-sm" : "text-[#111111]/50"
            }`}
          >
            {key === "core" ? "Core templates" : "Schema library"}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-[#E2F163]/50 bg-gradient-to-br from-[#EBEAE5] to-white p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#111111]/45">
          Selected preview
        </p>
        <div className="mt-2 flex justify-center">
          <ShapeExamplePreview shapeType={shapeType} title={previewTitle} scale={0.48} />
        </div>
        <p className="mt-1 text-center text-[12px] font-semibold text-[#111111]">
          {selected?.label}
        </p>
        <p className="text-center text-[10px] text-[#111111]/55">{selected?.description}</p>
      </div>

      {tab === "core" ? (
        <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1">
          {CORE_SHAPES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onPick(item.key, item.defaultTitle)}
              className={`overflow-hidden rounded-2xl border-2 text-left transition ${
                shapeType === item.key
                  ? "border-[#E2F163] bg-[#E2F163]/10 shadow-[0_0_0_1px_#E2F163]"
                  : "border-transparent bg-white shadow-sm hover:border-[#111111]/10"
              }`}
            >
              <div className="flex h-20 items-start justify-center overflow-hidden bg-[#EBEAE5]/50 pt-1">
                <ShapeExamplePreview shapeType={item.key} title={item.defaultTitle} scale={0.34} />
              </div>
              <div className="border-t border-black/5 px-2.5 py-2">
                <p className="text-[10px] font-semibold text-[#111111]">{item.label}</p>
                <p className="text-[9px] text-[#111111]/45">{item.key}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {FEATURED.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  const item = getShapeDefinition(key);
                  if (item) onPick(key, item.defaultTitle);
                }}
                className={`rounded-full px-3 py-1.5 text-[10px] font-medium ${
                  shapeType === key
                    ? "bg-[#111111] text-[#E2F163]"
                    : "bg-white text-[#111111]/70 ring-1 ring-black/10"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
          <Select
            value={isSchemaShape(shapeType) ? shapeType : undefined}
            onValueChange={(key) => {
              if (!key) return;
              const item = getShapeDefinition(key);
              if (item) onPick(key, item.defaultTitle);
            }}
          >
            <SelectTrigger className="h-auto min-h-11 w-full rounded-2xl border-[#111111]/10 bg-white px-3 py-2 shadow-sm">
              {isSchemaShape(shapeType) ? (
                <span className="flex flex-1 items-center gap-3 overflow-hidden text-left">
                  <span className="flex h-14 w-[72px] shrink-0 items-start justify-center overflow-hidden rounded-xl bg-[#EBEAE5]/80 pt-0.5">
                    <ShapeExamplePreview
                      shapeType={shapeType}
                      title={previewTitle}
                      scale={0.28}
                      compact
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12px] font-semibold text-[#111111]">
                      {shapeType}
                    </span>
                    <span className="block truncate text-[10px] text-[#111111]/55">
                      {selected?.label}
                    </span>
                  </span>
                </span>
              ) : (
                <SelectValue placeholder="Browse all schema shapes…" />
              )}
            </SelectTrigger>
            <SelectContent className="z-(--z-popover) max-h-72 w-[var(--anchor-width)] rounded-2xl border-[#111111]/10 p-1.5 shadow-xl">
              {schemaOptions.map((item) => (
                <SelectItem
                  key={item.key}
                  value={item.key}
                  className="rounded-xl py-2 focus:bg-[#E2F163]/15"
                >
                  <span className="flex w-full items-center gap-3">
                    <span className="flex h-14 w-[72px] shrink-0 items-start justify-center overflow-hidden rounded-xl bg-[#EBEAE5]/80 pt-0.5">
                      <ShapeExamplePreview
                        shapeType={item.key}
                        title={item.defaultTitle}
                        scale={0.28}
                        compact
                      />
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block text-[11px] font-semibold text-[#111111]">
                        {item.key}
                      </span>
                      <span className="block text-[10px] text-[#111111]/55">{item.label}</span>
                    </span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
