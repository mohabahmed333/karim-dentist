"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import {
  probeToothGltfKinds,
  toothGltfUrl,
  type Dentition,
  type NotationSystem,
  type ToothGltfKind,
} from "@/services/notation";
import type { PaintTool, SurfaceId, SurfaceMap } from "@/services/tooth_surfaces";
import {
  ANATOMICAL_ARCH_URL,
  AnatomicalArchViewer,
} from "../../shared/anatomical-arch";
import { SurfaceOdontogram } from "../SurfaceOdontogram";
import { cn } from "@/lib/utils";

const KindCanvas = dynamic(
  () => import("./ChartingGltfCanvas").then((m) => m.ChartingGltfCanvas),
  { ssr: false },
);

type Props = {
  dentition: Dentition;
  notation: NotationSystem;
  selectedFdi: string | null;
  tool: PaintTool;
  byFdi: Map<string, SurfaceMap>;
  onSelect: (fdi: string) => void;
  onDeselect: () => void;
  onPaint: (fdi: string, surface: SurfaceId) => void;
  /** Take the parent's height rather than the 52vh/420px box. */
  fill?: boolean;
};

async function probeArch(): Promise<boolean> {
  try {
    // HEAD, and the same URL the viewer loads: a GET here pulled the whole
    // model down only to read res.ok, then the viewer fetched it again.
    const res = await fetch(ANATOMICAL_ARCH_URL, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

export function ChartingGltfOdontogram(props: Props) {
  const [mode, setMode] = useState<"loading" | "arch" | "kinds" | "svg">(
    "loading",
  );
  const [available, setAvailable] = useState<Set<ToothGltfKind>>(new Set());

  useEffect(() => {
    let alive = true;
    void (async () => {
      const hasArch = await probeArch();
      if (!alive) return;
      if (hasArch) {
        setMode("arch");
        return;
      }
      const found = await probeToothGltfKinds();
      if (!alive) return;
      setAvailable(found);
      found.forEach((kind) => {
        void import("@react-three/drei").then(({ useGLTF }) => {
          useGLTF.preload(toothGltfUrl(kind));
        });
      });
      setMode(found.size > 0 ? "kinds" : "svg");
    })();
    return () => {
      alive = false;
    };
  }, []);

  if (mode === "loading") {
    return (
      <div
        className="mt-4 flex min-h-[320px] items-center justify-center text-[12px] text-[#64748B]"
      >
        Loading tooth models…
      </div>
    );
  }

  if (mode === "svg") {
    return (
      <>
        <p className="mt-3 text-[11px] text-[#64748B]">
          No 3D models found. Add{" "}
          <code className="rounded bg-[#EEF2F6] px-1">arch.glb</code> under{" "}
          <code className="rounded bg-[#EEF2F6] px-1">public/dental/teeth/</code>
          .
        </p>
        <SurfaceOdontogram {...props} />
      </>
    );
  }

  if (mode === "arch") {
    return (
      <div
        className={cn(
          "min-h-0 flex-1 overflow-hidden p-1",
          props.fill ? "" : "mt-4",
        )}
      >
        <div className={cn("w-full", props.fill ? "h-full" : "h-[min(52vh,420px)]")}>
          <AnatomicalArchViewer
            selectedFdi={props.selectedFdi}
            focusMode
            highlightColor="#2563eb"
            onSelectFdi={props.onSelect}
            className="h-full min-h-[320px] w-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-hidden",
        props.fill ? "" : "mt-4",
      )}
    >
      <div className={cn("w-full", props.fill ? "h-full" : "h-[min(52vh,420px)]")}>
        <KindCanvas
          dentition={props.dentition}
          selectedFdi={props.selectedFdi}
          available={available}
          onSelect={props.onSelect}
        />
      </div>
    </div>
  );
}
