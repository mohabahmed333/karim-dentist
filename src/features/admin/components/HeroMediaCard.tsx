"use client";

import { MediaUploadField, type MediaKind } from "./MediaUploadField";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = {
  mediaType: MediaKind;
  onMediaTypeChange: (type: MediaKind) => void;
  desktop: string;
  onDesktopChange: (url: string | null) => void;
  mobile: string;
  onMobileChange: (url: string | null) => void;
};

export function HeroMediaCard({
  mediaType,
  onMediaTypeChange,
  desktop,
  onDesktopChange,
  mobile,
  onMobileChange,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Media</CardTitle>
        <CardDescription>
          One type for both slots — upload image or video files.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <MediaUploadField
          label="Desktop"
          bucket="hero"
          folder="desktop"
          mediaType={mediaType}
          onMediaTypeChange={onMediaTypeChange}
          value={desktop || null}
          onChange={onDesktopChange}
        />
        <Separator />
        <MediaUploadField
          label="Mobile"
          bucket="hero"
          folder="mobile"
          mediaType={mediaType}
          onMediaTypeChange={onMediaTypeChange}
          value={mobile || null}
          onChange={onMobileChange}
        />
      </CardContent>
    </Card>
  );
}
