"use client";

import type { RefObject } from "react";
import { ShowreelDeviceMockup } from "./ShowreelDeviceMockup";
import type { ShowreelDeviceVariant } from "./showreelSlides";

type Props = {
  desktopOnly: boolean;
  desktopSrc: string;
  mobileSrc: string;
  desktopRef: RefObject<HTMLIFrameElement | null>;
  mobileRef: RefObject<HTMLIFrameElement | null>;
  hidden: boolean;
  onDesktopReady: () => void;
  onMobileReady: () => void;
};

export function ShowreelFeatureDeviceStage({
  desktopOnly,
  desktopSrc,
  mobileSrc,
  desktopRef,
  mobileRef,
  hidden,
  onDesktopReady,
  onMobileReady,
}: Props) {
  return (
    <div
      className={
        desktopOnly
          ? "showreel-device-stage"
          : "showreel-device-stage showreel-device-stage--row"
      }
      aria-hidden={hidden}
    >
      <div className="showreel-device-halo" aria-hidden />
      <ShowreelDeviceMockup
        variant="desktop"
        src={desktopSrc}
        iframeRef={desktopRef}
        onReady={onDesktopReady}
        className="showreel-anim-device"
      />
      {!desktopOnly ? (
        <ShowreelDeviceMockup
          variant="mobile"
          src={mobileSrc}
          iframeRef={mobileRef}
          onReady={onMobileReady}
          className="showreel-anim-device"
        />
      ) : null}
    </div>
  );
}
