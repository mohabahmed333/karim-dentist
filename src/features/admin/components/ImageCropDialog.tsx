"use client";

import { useEffect, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslations } from "@/lib/i18n";
import { cropImageFile } from "@/lib/supabase/cropImage";

type Props = {
  open: boolean;
  file: File | null;
  busy?: boolean;
  onOpenChange: (open: boolean) => void;
  onCropped: (file: File) => void;
};

function defaultPercentCrop(width: number, height: number): Crop {
  return centerCrop(
    { unit: "%", width: 90, height: 90, x: 0, y: 0 },
    width,
    height,
  );
}

export function ImageCropDialog({
  open,
  file,
  busy = false,
  onOpenChange,
  onCropped,
}: Props) {
  const t = useTranslations();
  const imgRef = useRef<HTMLImageElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completed, setCompleted] = useState<PixelCrop | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setCrop(undefined);
    setCompleted(null);
    setError(null);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function onImageLoad(image: HTMLImageElement) {
    const { width, height } = image;
    if (!width || !height) return;
    const next = defaultPercentCrop(width, height);
    setCrop(next);
    setCompleted(convertToPixelCrop(next, width, height));
  }

  async function apply() {
    if (!file || !completed || !imgRef.current) return;
    setError(null);
    try {
      const image = imgRef.current;
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      onCropped(
        await cropImageFile(file, {
          x: completed.x * scaleX,
          y: completed.y * scaleY,
          width: completed.width * scaleX,
          height: completed.height * scaleY,
        }),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("admin.customize.cropFailed"),
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl" showCloseButton>
        <DialogHeader>
          <DialogTitle>{t("admin.customize.cropImage")}</DialogTitle>
        </DialogHeader>
        {src ? (
          <div className="flex max-h-[60vh] justify-center overflow-auto bg-[#f4f4f5] p-2">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(pixelCrop) => setCompleted(pixelCrop)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={src}
                alt=""
                style={{ maxHeight: "55vh", maxWidth: "100%", display: "block" }}
                onLoad={(event) => onImageLoad(event.currentTarget)}
              />
            </ReactCrop>
          </div>
        ) : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {t("admin.customize.cancel")}
          </Button>
          <Button
            type="button"
            disabled={busy || !completed?.width || !completed?.height}
            onClick={() => void apply()}
          >
            {t("admin.customize.applyCrop")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
