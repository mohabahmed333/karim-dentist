export type TimelineEventCategory = "SURGERY" | "XRAY" | "LAB" | "NOTE";

export type TimelineScrubberEvent = {
  id: string;
  date: Date;
  count: number;
  category: TimelineEventCategory;
};

export type TimelineHandleStyle = "BAR" | "PILL" | "DIAMOND";

export type TimelineScrubberProps = {
  minDate: Date;
  maxDate: Date;
  initialRange: [Date, Date];
  range: [Date, Date];
  highlightColor?: string;
  trackBgColor?: string;
  handleStyle?: TimelineHandleStyle;
  events: TimelineScrubberEvent[];
  enableZoom?: boolean;
  enableSnap?: boolean;
  zoomScale?: number;
  yearLabels?: number[];
  onRangeChange: (startDate: Date, endDate: Date) => void;
  onEventClick: (eventId: string) => void;
  onZoomChange: (scale: number) => void;
};

export const DEFAULT_ZOOM_LEVELS = [1, 2, 4] as const;
