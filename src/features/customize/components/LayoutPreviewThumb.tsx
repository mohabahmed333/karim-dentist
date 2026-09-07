import type { LayoutPreviewKey } from "../lib/layoutCatalog";

type Props = { preview: LayoutPreviewKey; large?: boolean };

export function LayoutPreviewThumb({ preview, large }: Props) {
  return (
    <div
      className={
        large ? "layout-preview-thumb layout-preview-thumb--large" : "layout-preview-thumb"
      }
      aria-hidden
    >
      {preview === "title" ? <TitlePreview /> : null}
      {preview === "intro" ? <IntroPreview /> : null}
      {preview === "text" ? <TextPreview /> : null}
      {preview === "text-center" ? <TextCenterPreview /> : null}
      {preview === "media" ? <MediaPreview /> : null}
      {preview === "media-square" ? <MediaSquarePreview /> : null}
      {preview === "media-portrait" ? <MediaPortraitPreview /> : null}
      {preview === "split" ? <SplitPreview /> : null}
      {preview === "split-right" ? <SplitRightPreview /> : null}
      {preview === "split-portrait" ? <SplitPortraitPreview /> : null}
      {preview === "text-grid" ? <TextGridPreview /> : null}
      {preview === "text-grid-right" ? <TextGridRightPreview /> : null}
      {preview === "grid-2" ? <GridPreview cols={2} /> : null}
      {preview === "grid-3" ? <GridPreview cols={3} /> : null}
      {preview === "grid-4" ? <GridPreview cols={4} /> : null}
      {preview === "columns" ? <ColumnsPreview /> : null}
    </div>
  );
}

function TitlePreview() {
  return (
    <div className="lp-frame">
      <span className="lp-line lp-line--xs lp-w-24" />
      <span className="lp-line lp-line--lg lp-w-70" />
    </div>
  );
}

function IntroPreview() {
  return (
    <div className="lp-frame lp-row">
      <span className="lp-line lp-line--sm lp-w-30" />
      <div className="lp-stack lp-grow">
        <span className="lp-line lp-w-100" />
        <span className="lp-line lp-w-90" />
        <span className="lp-line lp-w-70" />
      </div>
    </div>
  );
}

function TextPreview() {
  return (
    <div className="lp-frame lp-stack">
      <span className="lp-line lp-line--sm lp-w-40" />
      <span className="lp-line lp-w-100" />
      <span className="lp-line lp-w-95" />
      <span className="lp-line lp-w-80" />
    </div>
  );
}

function TextCenterPreview() {
  return (
    <div className="lp-frame lp-stack lp-center">
      <span className="lp-line lp-line--sm lp-w-40" />
      <span className="lp-line lp-w-80" />
      <span className="lp-line lp-w-70" />
    </div>
  );
}

function MediaPreview() {
  return (
    <div className="lp-frame">
      <span className="lp-block lp-block--wide" />
    </div>
  );
}

function MediaSquarePreview() {
  return (
    <div className="lp-frame lp-center">
      <span className="lp-block lp-block--square" />
    </div>
  );
}

function MediaPortraitPreview() {
  return (
    <div className="lp-frame lp-center">
      <span className="lp-block lp-block--portrait" />
    </div>
  );
}

function SplitPreview() {
  return (
    <div className="lp-frame lp-row">
      <span className="lp-block lp-grow" />
      <div className="lp-stack lp-w-40">
        <span className="lp-line lp-line--sm lp-w-70" />
        <span className="lp-line lp-w-100" />
        <span className="lp-line lp-w-90" />
      </div>
    </div>
  );
}

function SplitRightPreview() {
  return (
    <div className="lp-frame lp-row">
      <div className="lp-stack lp-w-40">
        <span className="lp-line lp-line--sm lp-w-70" />
        <span className="lp-line lp-w-100" />
        <span className="lp-line lp-w-90" />
      </div>
      <span className="lp-block lp-grow" />
    </div>
  );
}

function SplitPortraitPreview() {
  return (
    <div className="lp-frame lp-row">
      <div className="lp-stack lp-w-40">
        <span className="lp-line lp-line--sm lp-w-70" />
        <span className="lp-line lp-w-100" />
        <span className="lp-line lp-w-90" />
      </div>
      <span className="lp-block lp-block--portrait lp-w-35" />
    </div>
  );
}

function TextGridPreview() {
  return (
    <div className="lp-frame lp-row">
      <div className="lp-stack lp-w-35">
        <span className="lp-line lp-w-100" />
        <span className="lp-line lp-w-90" />
        <span className="lp-line lp-w-70" />
      </div>
      <div className="lp-grid-2 lp-grow">
        <span className="lp-block" />
        <span className="lp-block" />
        <span className="lp-block" />
        <span className="lp-block" />
      </div>
    </div>
  );
}

function TextGridRightPreview() {
  return (
    <div className="lp-frame lp-row">
      <div className="lp-grid-2 lp-grow">
        <span className="lp-block" />
        <span className="lp-block" />
        <span className="lp-block" />
        <span className="lp-block" />
      </div>
      <div className="lp-stack lp-w-35">
        <span className="lp-line lp-w-100" />
        <span className="lp-line lp-w-90" />
        <span className="lp-line lp-w-70" />
      </div>
    </div>
  );
}

function GridPreview({ cols }: { cols: 2 | 3 | 4 }) {
  const count = cols;
  return (
    <div className={`lp-frame lp-grid-${cols}`}>
      {Array.from({ length: count }, (_, i) => (
        <span key={i} className="lp-block" />
      ))}
    </div>
  );
}

function ColumnsPreview() {
  return (
    <div className="lp-frame lp-grid-3">
      <div className="lp-stack">
        <span className="lp-line lp-w-80" />
        <span className="lp-line lp-w-100" />
      </div>
      <span className="lp-block" />
      <span className="lp-block" />
    </div>
  );
}
