export const TEXT_WIDTH_OPTIONS = [
  { value: "narrow", label: "Narrow" },
  { value: "medium", label: "Medium" },
  { value: "wide", label: "Wide" },
] as const;

export const TEXT_ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
] as const;

export const ASPECT_RATIO_OPTIONS = [
  { value: "16/9", label: "16:9" },
  { value: "4/3", label: "4:3" },
  { value: "1/1", label: "1:1" },
  { value: "3/4", label: "3:4" },
  { value: "auto", label: "Auto" },
] as const;

export const CROP_POSITION_OPTIONS = [
  { value: "center", label: "Center" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
] as const;

export const SIDE_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
] as const;

export const SPLIT_RATIO_OPTIONS = [
  { value: "40/60", label: "40 / 60" },
  { value: "50/50", label: "50 / 50" },
] as const;

export const SPLIT_MEDIA_ASPECT_OPTIONS = [
  { value: "16/9", label: "16:9" },
  { value: "3/4", label: "3:4" },
  { value: "1/1", label: "1:1" },
] as const;

export const COLUMN_ASPECT_RATIO_OPTIONS = [
  { value: "16/9", label: "16:9" },
  { value: "4/3", label: "4:3" },
  { value: "1/1", label: "1:1" },
  { value: "3/4", label: "3:4" },
] as const;

export const GRID_COLUMNS_OPTIONS = [
  { value: "2", label: "2 columns" },
  { value: "3", label: "3 columns" },
  { value: "4", label: "4 columns" },
] as const;
